/* MIT License - see LICENSE for details. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function resolveGitRoot(repoPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', [
      '-C',
      repoPath,
      'rev-parse',
      '--show-toplevel',
    ]);
    return stdout.trim();
  } catch (error) {
    throw new Error(`Path is not a git repository: ${repoPath}`, {
      cause: error,
    });
  }
}
