const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const { execFileSync } = require('child_process')
const path = require('path')

const { setupRepo, cleanupRepo, baseDir } = require('./helpers/setup')
const run = require('./helpers/run')
const cliPath = path.join(__dirname, '..', 'bin', 'mygit.js')

function stripAnsi(text) {
    return text.replace(/\x1b\[[0-9;]*m/g, '')
}

function writeFile(filePath, content) {
    const fullPath = path.join(baseDir, filePath)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, content)
}

function initMainBranch() {
    fs.mkdirSync(path.join(baseDir, '.mygit', 'refs', 'heads'), { recursive: true })
    fs.writeFileSync(path.join(baseDir, '.mygit', 'HEAD'), 'ref: refs/heads/main')
}

function stage(filePath) {
    run(`node ${cliPath} add ${filePath}`)
}

function commit(message) {
    return stripAnsi(run(`node ${cliPath} commit -m ${message}`))
}

function readMainCommit() {
    return fs.readFileSync(path.join(baseDir, '.mygit', 'refs', 'heads', 'main'), 'utf-8').trim()
}

test.beforeEach(() => {
    setupRepo()
    initMainBranch()
})

test.afterEach(cleanupRepo)

console.log('\nTESTING DIFF\n')

test('diff reports when nothing is staged yet', () => {
    const output = stripAnsi(run(`node ${cliPath} diff`))

    assert.strictEqual(output, 'nothing staged')
})

test('diff stays silent when the working tree matches the index', () => {
    writeFile('tracked.txt', 'hello')
    stage('tracked.txt')

    const output = stripAnsi(run(`node ${cliPath} diff`))

    assert.strictEqual(output, '')
})

test('diff shows modified working tree files against the index', () => {
    writeFile('tracked.txt', 'hello')
    stage('tracked.txt')

    writeFile('tracked.txt', 'world')

    const output = stripAnsi(run(`node ${cliPath} diff`))

    assert.match(output, /diff --mygit a\/tracked\.txt b\/tracked\.txt/)
    assert.match(output, /index [0-9a-f]{7}\.\.0000000 100644/)
    assert.match(output, /@@ -1,1 \+1,1 @@/)
    assert.match(output, /-hello/)
    assert.match(output, /\+world/)
})

test('diff shows deleted working tree files against the index', () => {
    writeFile('deleted.txt', 'removed from disk')
    stage('deleted.txt')
    fs.unlinkSync(path.join(baseDir, 'deleted.txt'))

    const output = stripAnsi(run(`node ${cliPath} diff`))

    assert.match(output, /diff --mygit a\/deleted\.txt b\/deleted\.txt/)
    assert.match(output, /deleted file mode 100644/)
    assert.match(output, /-removed from disk/)
})

test('diff --cached shows staged modifications against HEAD', () => {
    writeFile('cached.txt', 'alpha')
    stage('cached.txt')
    commit('initial commit')

    writeFile('cached.txt', 'beta')
    stage('cached.txt')

    const output = stripAnsi(run(`node ${cliPath} diff --cached`))

    assert.match(output, /diff --mygit a\/cached\.txt b\/cached\.txt/)
    assert.match(output, /index [0-9a-f]{7}\.\.[0-9a-f]{7} 100644/)
    assert.match(output, /@@ -1,1 \+1,1 @@/)
    assert.match(output, /-alpha/)
    assert.match(output, /\+beta/)
})

test('diff --cached shows newly staged files against HEAD', () => {
    writeFile('base.txt', 'base')
    stage('base.txt')
    commit('initial commit')

    writeFile('new-file.txt', 'new content')
    stage('new-file.txt')

    const output = stripAnsi(run(`node ${cliPath} diff --cached`))

    assert.match(output, /diff --mygit a\/new-file\.txt b\/new-file\.txt/)
    assert.match(output, /new file mode 100644/)
    assert.match(output, /--- \/dev\/null/)
    assert.match(output, /\+new content/)
})

test('diff between two commits shows modified and added files', () => {
    writeFile('shared.txt', 'one')
    stage('shared.txt')
    commit('first commit')
    const firstCommit = readMainCommit()

    writeFile('shared.txt', 'two')
    writeFile('added.txt', 'fresh file')
    stage('shared.txt')
    stage('added.txt')
    commit('second commit')
    const secondCommit = readMainCommit()

    const output = stripAnsi(run(`node ${cliPath} diff ${firstCommit} ${secondCommit}`))

    assert.match(output, /diff --mygit a\/shared\.txt b\/shared\.txt/)
    assert.match(output, /-one/)
    assert.match(output, /\+two/)
    assert.match(output, /diff --mygit a\/added\.txt b\/added\.txt/)
    assert.match(output, /new file mode 100644/)
    assert.match(output, /\+fresh file/)
})
