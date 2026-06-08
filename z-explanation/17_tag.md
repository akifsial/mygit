# The `tag` command

## What it is and what it does

`mygit tag` manages **lightweight tags** — named pointers to commits stored
under `.mygit/refs/tags/`.

```bash
mygit tag                           # list all tags
mygit tag v1.0.0                    # create tag pointing to HEAD
mygit tag v1.0.0 <commit-or-ref>    # create tag pointing to a specific commit/branch
mygit tag -f v1.0.0                 # force-overwrite an existing tag
mygit tag -d v1.0.0                 # delete a tag
```

Tags are useful for marking release points:

```bash
mygit tag v2.3.1
# later…
mygit log v2.3.1   # inspect what was committed at that point
```

## Tag storage

Each tag is a plain text file inside `.mygit/refs/tags/<name>` containing a
single 40-character commit hash followed by a newline:

```
.mygit/
└── refs/
    └── tags/
        ├── v1.0.0          ← contains "abc123…\n"
        └── v2.0.0-beta     ← contains "def456…\n"
```

## Implementation explained

The command is implemented in `src/commands/tag.js`.

### Tag name validation: `validateTagName(name)`

Mirrors a subset of `git check-ref-format` rules:

| Rule | Reason |
|---|---|
| No embedded `/` or `\` | Would escape `refs/tags/` via path traversal |
| No whitespace or NUL | Shell-safety |
| Must not start with `-` or `.` | Git convention |

```javascript
function validateTagName(name) {
    if (!name || name.length === 0)           return 'tag name must be a non-empty string'
    if (name.includes('/'))                   return `invalid tag name '${name}': must not contain '/'`
    if (/[\s\0]/.test(name))                  return `invalid tag name '${name}': must not contain whitespace`
    if (name.startsWith('-') || name.startsWith('.')) return `invalid tag name '${name}': bad start character`
    return null
}
```

### Resolving a commit ref: `resolveCommit(ref)`

The `ref` argument can be:
- A **full 40-char SHA-1 hash** → validated by reading the object directly.
- A **branch name** → looked up in `.mygit/refs/heads/<ref>`.
- A **tag name** → looked up in `.mygit/refs/tags/<ref>`.

```javascript
function resolveCommit(ref) {
    if (isFullHash(ref)) { /* read & verify object type */ return ref }

    const branchPath = getRefPath('heads', ref)
    if (fs.existsSync(branchPath)) return fs.readFileSync(branchPath, 'utf-8').trim()

    const tagPath = getRefPath('tags', ref)
    if (fs.existsSync(tagPath))    return fs.readFileSync(tagPath, 'utf-8').trim()

    console.error(`fatal: '${ref}' is not a valid ref`)
    process.exit(1)
}
```

### Creating a tag: `createTag(name, commitHash, force)`

```javascript
function createTag(name, commitHash, force) {
    ensureTagNameValid(name)
    const tagPath = path.join(getTagsPath(), name)

    if (fs.existsSync(tagPath) && !force) {
        console.error(`fatal: tag '${name}' already exists`)
        process.exit(1)
    }

    fs.writeFileSync(tagPath, commitHash + '\n')
}
```

### Entry point: `tag(args)`

```javascript
function tag(args) {
    ensureRepo()
    const { opts, positional } = parseArgs(args || [])

    if (opts.delete)            return deleteTag(positional[0])
    if (positional.length === 0) return listTags()

    const name       = positional[0]
    const commitHash = positional.length >= 2
        ? resolveCommit(positional[1])   // explicit target
        : getCurrentCommit()             // default: HEAD

    createTag(name, commitHash, opts.force)
}

module.exports = tag
```
