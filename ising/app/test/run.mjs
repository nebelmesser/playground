import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('.', import.meta.url));
const selected = process.argv.slice(2).map((name) => basename(name).replace(/\.ts$/, ''));
const tests = (await readdir(directory))
  .filter((name) => name.endsWith('.ts') && (!selected.length
    || selected.includes(name.slice(0, -3))))
  .sort();
if (tests.length === 0 || selected.some((name) => !tests.includes(`${name}.ts`))) {
  console.error('No matching tests. Pass test filenames, or omit them to run the suite.');
  process.exit(1);
}
const output = await mkdtemp(join(tmpdir(), 'ising-tests-'));
const failed = [];
try {
  // Bundling also resolves the extensionless imports used by browser source,
  // without depending on experimental TypeScript support in the Node runtime.
  await build({
    entryPoints: tests.map((name) => join(directory, name)),
    outdir: output, outExtension: { '.js': '.mjs' },
    bundle: true, platform: 'node', format: 'esm', logLevel: 'warning',
  });
  for (const name of tests) {
    console.log(`\n${name}`);
    const result = spawnSync(process.execPath, [join(output, name.replace(/\.ts$/, '.mjs'))],
      { stdio: 'inherit', timeout: 120_000 });
    if (result.status !== 0) {
      failed.push(name);
      if (result.error) console.error(result.error.message);
    }
  }
} finally {
  await rm(output, { recursive: true, force: true });
}
console.log(`\n${tests.length - failed.length}/${tests.length} tests passed.`);
if (failed.length) {
  console.error(`Failed: ${failed.join(', ')}`);
  process.exitCode = 1;
}
