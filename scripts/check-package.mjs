import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const expected = JSON.parse(readFileSync(path.join(root, 'package.json')));
assert.equal(process.argv.length, 3, 'Pass the exact .tgz to check');
const archive = realpathSync(process.argv[2]);
const temp = mkdtempSync(path.join(tmpdir(), 'nstdata-n8n-package-'));
try {
    // Install exactly this tarball. n8n supplies the workflow peer at runtime.
    execFileSync('npm', ['install', '--prefix', temp, '--offline', '--ignore-scripts', '--legacy-peer-deps',
        '--no-audit', '--no-fund', '--no-package-lock', archive], { stdio: 'inherit' });
    symlinkSync(realpathSync(path.join(root, 'node_modules/n8n-workflow')), path.join(temp, 'node_modules/n8n-workflow'), 'dir');
    const installed = path.join(temp, 'node_modules', expected.name);
    assert.deepEqual(readdirSync(installed).filter(file => /\.md$/i.test(file)).sort(), ['README.md'],
        'Ship only the English README at the package root');
    const load = createRequire(path.join(installed, 'package.json'));
    const pkg = load('./package.json');
    assert.equal(pkg.name, expected.name);
    assert.equal(pkg.version, expected.version);
    assert.deepEqual(pkg.n8n, expected.n8n);
    assert.deepEqual(Object.keys(pkg.dependencies ?? {}), []);
    for (const entry of [...pkg.n8n.nodes, ...pkg.n8n.credentials]) {
        const className = path.basename(entry).split('.')[0];
        const instance = new (load('./' + entry)[className])();
        const metadata = instance.description ?? instance;
        for (const icon of Object.values(metadata.icon)) {
            assert.ok(icon.startsWith('file:'));
            assert.ok(readFileSync(path.resolve(installed, path.dirname(entry), icon.slice(5))).length);
        }
    }
    const codex = load('./' + pkg.n8n.nodes[0].replace(/\.js$/, '.json'));
    assert.equal(codex.node, pkg.name + '.nstdataCrawl');
    const workflow = load('./examples/multiple-urls-to-markdown.json');
    assert.ok(workflow.nodes.some(node => node.type === codex.node));
    for (const file of ['README.md', 'LICENSE']) assert.ok(readFileSync(path.join(installed, file)).length);
    execFileSync(process.execPath, ['--test', path.join(root, 'test/crawl.test.cjs')], {
        env: { ...process.env, NSTDATA_TEST_PACKAGE_ROOT: installed }, stdio: 'inherit',
    });
} finally {
    rmSync(temp, { recursive: true, force: true });
}
