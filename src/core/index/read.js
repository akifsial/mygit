const fs = require('../../utils/filesystem')
const { IndexFormatError } = require('../../errors')
const Repository = require('../repository/repository')


/**
 * Create an empty index structure
 * 
 * @returns {Object}
 */
function createEmptyIndex() {
    return {
        version: 1,
        entries: {}
    }
}

/**
 * Read repository index
 * 
 * Returns an empty index if the file does not exist
 * 
 * @param {Repository} repo Repository object
 * @returns {Object}
 */
function readIndex(repo) {
    const indexPath = repo.paths.index

    if (!fs.exists(indexPath)) {
        return createEmptyIndex()
    }

    try {
        const content = fs.readFile(indexPath)
        const index = JSON.parse(content)

        if (typeof index !== 'object' || index === null) {
            throw new IndexFormatError()
        }

        if (typeof index.version !== 'number') {
            throw new IndexFormatError('Index version missing')
        }
        if (!index.entries || typeof index.entries !== 'object') {
            throw new IndexFormatError('Index entries missing')
        }

        return index
    } catch (error) {
        if (error instanceof IndexFormatError) {
            throw error
        }

        throw new IndexFormatError(`Failed to read index: ${error.message}`)
    }
}

module.exports = {
    readIndex,
    createEmptyIndex
}