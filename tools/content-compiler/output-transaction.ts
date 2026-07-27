import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

export async function atomicReplaceDirectory(
  outputDir: string,
  populate: (temporaryDir: string) => Promise<void>,
): Promise<void> {
  const target = path.resolve(outputDir);
  const parent = path.dirname(target);
  const token = `${process.pid}-${Date.now()}`;
  const temporary = path.join(parent, `.${path.basename(target)}-next-${token}`);
  const backup = path.join(parent, `.${path.basename(target)}-previous-${token}`);
  await mkdir(parent, { recursive: true });
  await rm(temporary, { recursive: true, force: true });

  try {
    await mkdir(temporary, { recursive: true });
    await populate(temporary);

    let hadPrevious = false;
    try {
      await rename(target, backup);
      hadPrevious = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    try {
      await rename(temporary, target);
      if (hadPrevious) await rm(backup, { recursive: true, force: true });
    } catch (error) {
      if (hadPrevious) await rename(backup, target);
      throw error;
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
