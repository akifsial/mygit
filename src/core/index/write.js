const fs = require('../../utils/filesystem')
const { validateIndex } = require('./entries')
const { IndexFormatError } = require('../../errors')

function serializeIndex(index) {
    validateIndex(index)

    return JSON.stringify(index, null, 2)
}

function writeIndex(repo, index) {
    validateIndex(index)

    try {
        const content = serializeIndex(index)

        fs.writeFile(repo.paths.index, content)

    } catch (error) {
        throw new IndexFormatError(`Failed to write index: ${error.message}`)
    }
}

module.exports = {
    writeIndex,
    serializeIndex
}
