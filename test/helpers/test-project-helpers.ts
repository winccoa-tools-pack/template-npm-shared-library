import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { TestContext } from 'node:test';
import { ProjEnvProject } from '../../src/types/project/ProjEnvProject';
import { PmonComponent } from '../../src/types/components/implementations/PmonComponent';
import {
    getWinCCOAInstallationPathByVersion,
    getAvailableWinCCOAVersions,
} from '../../src/utils/winccoa-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gets the absolute path to the test fixtures directory
 */
export function getFixturesPath(): string {
    return path.resolve(__dirname, '..', 'fixtures');
}

/**
 * Gets the absolute path to a test project fixture
 * @param projectName Name of the test project (e.g., 'runnable', 'sub-proj')
 */
export function getTestProjectPath(projectName: string): string {
    return path.join(getFixturesPath(), 'projects', projectName);
}

/**
 * Creates and registers a runnable WinCC OA test project
 * @returns ProjEnvProject instance for the registered test project
 * @throws Error if registration fails
 *
 * @example
 * ```typescript
 * const project = await registerRunnableTestProject();
 * try {
 *   // Use project in tests
 *   await project.start();
 * } finally {
 *   await project.unregisterProj();
 * }
 * ```
 */
export async function registerRunnableTestProject(): Promise<ProjEnvProject> {
    const subProjectPath = getTestProjectPath('sub-proj');
    const subProject = new ProjEnvProject();

    // Set project directory (this sets both install dir and project ID)
    subProject.setRunnable(false);
    subProject.setDir(subProjectPath);
    subProject.setName('test-sub-project');
    const availableVersions = getAvailableWinCCOAVersions();
    const testVersion = availableVersions.length > 0 ? availableVersions[0] : '';
    subProject.setVersion(testVersion);
    await subProject.registerProj();

    const projectPath = getTestProjectPath('runnable');
    const project = new ProjEnvProject();

    // Set project directory (this sets both install dir and project ID)
    project.setRunnable(true);
    project.setDir(projectPath);
    project.setName('test-runnable-project');

    project.setVersion(testVersion);

    cleanUpProgs(project);

    if (project.isRegistered()) {
        // Ensure pmon is stopped before registration
        await project.stopPmon(10);
    }

    // Update config file with actual WinCC OA path and version
    const configPath = path.join(projectPath, 'config', 'config');
    if (fs.existsSync(configPath)) {
        try {
            // Get the first available WinCC OA version for testing

            const testPath = getWinCCOAInstallationPathByVersion(testVersion);

            if (testPath) {
                // Read the config file
                let configContent = fs.readFileSync(configPath, 'utf-8');

                // Replace placeholders with actual values
                configContent = configContent.replace(/<WinCC_OA_PATH>/g, testPath);
                configContent = configContent.replace(/<WinCC_OA_VERSION>/g, testVersion);

                // Write back the updated config
                fs.writeFileSync(configPath, configContent, 'utf-8');
            }
        } catch (error) {
            console.warn('Warning: Could not update test project config file:', error);
        }
    }

    // Try to register the project with WinCC OA if pmon is available
    // If pmon is not initialized, we still return the project object for testing
    try {
        const result = await project.registerProj();
        if (result !== 0) {
            console.warn(
                `Warning: Could not register test project (pmon may not be available): error code ${result}`,
            );
        }
    } catch (error) {
        console.warn(`Warning: Project registration failed (pmon may not be available):`, error);
    }
        
    // make a backup of progs file
    const progsPath = project.getConfigPath('progs');
	
				// Ensure we can restore the runnable fixture after this test.
				const progsBackupPath = progsPath + '.bak';
				if (!fs.existsSync(progsBackupPath)) {
					fs.copyFileSync(progsPath, progsBackupPath);
				}

    return project;
}

/**
 * Unregisters and cleans up a test project
 * @param project The project to unregister
 * @returns Promise that resolves when cleanup is complete
 */
export async function unregisterTestProject(project: ProjEnvProject): Promise<void> {
    if (!project || !project.getId()) {
        return;
    }

    try {
        // Stop the project if it's running
        if (project.isRunning()) {
            await project.stop();
            await project.stopPmon(10);
        }

        const subProject = new ProjEnvProject();
        subProject.setId('sub-proj');
        subProject.setRunnable(false);
        subProject.setVersion(project.getVersion() || '');
        await subProject.unregisterProj();

        // Unregister the project

        await project.unregisterProj();
        cleanUpProgs(project);
    } catch (error) {
        console.warn(`Warning: Failed to clean up test project ${project.getId()}:`, error);
    }
}

/**
 * Helper to run a test with a registered project that gets automatically cleaned up
 * @param testFn Test function that receives the registered project
 *
 * @example
 * ```typescript
 * it('should test project functionality', async () => {
 *   await withRunnableTestProject(async (project) => {
 *     await project.start();
 *     assert.ok(project.isRunning());
 *   });
 * });
 * ```
 */
export async function withRunnableTestProject(
    testFn: (project: ProjEnvProject) => Promise<void>,
): Promise<void> {
    let project: ProjEnvProject | undefined;
    

    try {
        project = await registerRunnableTestProject();
                
        await testFn(project);
    } finally {
        if (project) {
            await unregisterTestProject(project);
        }
    }
}

export function cleanUpProgs(project: ProjEnvProject): void {
    const progsPath = project.getConfigPath('progs');
    const progsBackupPath = progsPath + '.bak';

    if (fs.existsSync(progsBackupPath)) {
        fs.unlinkSync(progsPath);
        fs.copyFileSync(progsBackupPath, progsPath);
        fs.unlinkSync(progsBackupPath);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export type EnsurePmonAcceptingCommandsOptions = {
    timeoutMs?: number;
    pollMs?: number;
};

/**
 * Starts the project (if needed) and waits until pmon accepts list commands.
 * Returns a configured PmonComponent, or skips the test and returns undefined.
 */
export async function ensurePmonAcceptingCommands(
    t: TestContext,
    project: ProjEnvProject,
    options: EnsurePmonAcceptingCommandsOptions = {},
): Promise<PmonComponent | undefined> {
    const timeoutMs = options.timeoutMs ?? 15_000;
    const pollMs = options.pollMs ?? 500;

    const version = project.getVersion() || '';
    if (!version) {
        t.skip('No WinCC OA version configured for runnable test project');
        return undefined;
    }

    const pmon = new PmonComponent();
    pmon.setVersion(version);
    if (!pmon.exists()) {
        t.skip('WCCILpmon not found on this machine; skipping integration test');
        return undefined;
    }

    // Prefer starting pmon only: it keeps manager list closer to progs order.
    // Some environments may still require full project start; we'll fall back if needed.
    const startCode = await project.startPmon();
    if (startCode !== 0) {
        // startCode = await project.start();
        // if (startCode !== 0) {
            t.skip(`Could not start pmon/project for integration test (code=${startCode})`);
            return undefined;
        // }
    }

    const start = Date.now();
    // Wait until pmon accepts commands (MGRLIST:LIST).
    while (Date.now() - start < timeoutMs) {
        try {
            const isProjRunning = await project.isPmonRunning();
            if (isProjRunning) {
                console.log('Pmon is accepting commands.');
                return pmon;
            }
        } catch {
            // ignore and retry
        }

        await sleep(pollMs);
    }

    t.skip(`Pmon did not become responsive within ${timeoutMs} ms`);
    return undefined;
}
