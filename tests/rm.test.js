const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert')

const add = require('../src/commands/add')
const rm = require('../src/commands/rm')
const captureOutput = require('./helpers/captureOutput')
const { cleanupRepo, baseDir, setupRepo } = require('./helpers/setup')

function readIndex() {
    const indexPath = path.join(baseDir, '.mygit', 'index')
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
}

test.beforeEach(() => {
    setupRepo()

    fs.writeFileSync(
        path.join(baseDir, '.mygit', 'index'),
        JSON.stringify({ version: 1, entries: {} }, null, 2)
    )
})

test.afterEach(cleanupRepo)

// ____TESTS____

console.log('\nTESTING RM\n')

test('rm removes a staged file from index and working tree', () => {
    fs.writeFileSync('file.txt', 'hello world')

    add(['file.txt'])
    rm(['file.txt'])

    const index = readIndex()

    assert.strictEqual(index.entries['file.txt'], undefined)
    assert.strictEqual(fs.existsSync(path.join(baseDir, 'file.txt')), false)
})

test('rm --cached removes a staged file from index but leaves working tree', () => {
    fs.writeFileSync('cached.txt', 'cached content')

    add(['cached.txt'])
    rm(['--cached', 'cached.txt'])

    const index = readIndex()

    assert.strictEqual(index.entries['cached.txt'], undefined)
    assert.strictEqual(fs.existsSync(path.join(baseDir, 'cached.txt')), true)
})

test('rm of unstaged file prints fatal pathspec error', () => {
    fs.writeFileSync('unstaged.txt', 'not staged')

    const { output, exitCode } = captureOutput(() => {
        rm(['unstaged.txt'])
    }, true)

    assert.strictEqual(output, "fatal: pathspec 'unstaged.txt' did not match any files")
    assert.strictEqual(exitCode, null)
})

test('rm with no args prints nothing specified hint', () => {
    const { output, exitCode } = captureOutput(() => {
        rm([])
    }, true)

    assert.strictEqual(output, 'Nothing specified, nothing removed.')
    assert.strictEqual(exitCode, null)
})

test('rm with multiple paths removes each entry', () => {
    fs.writeFileSync('a.txt', 'A')
    fs.writeFileSync('b.txt', 'B')

    add(['a.txt', 'b.txt'])
    rm(['a.txt', 'b.txt'])

    const index = readIndex()

    assert.strictEqual(index.entries['a.txt'], undefined)
    assert.strictEqual(index.entries['b.txt'], undefined)
    assert.strictEqual(fs.existsSync(path.join(baseDir, 'a.txt')), false)
    assert.strictEqual(fs.existsSync(path.join(baseDir, 'b.txt')), false)
})
