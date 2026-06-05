const { isValidTagName} = require('../../utils/validation') 
const { ValidationError } = require('../../errors')
const { tagPath } = require('../repository/paths')
const {
    createReference,
    readReference,
    updateReference,
    deleteReference,
    referenceExists,
    buildReference
} = require('./references')

// Validation

function validateTagName(tagName) {
    if (!isValidTagName(tagName)) {
        throw new ValidationError(`Invalid tag name: ${tagName}`)
    }
}

// Core 

function createTag(repo, tagName, hash) {
    validateTagName(tagName)

    createReference(tagPath(repo, tagName), hash)
}

function readTag(repo, tagName) {
    validateTagName(tagName)

    return readReference(tagPath(repo, tagName))
}

function updateTag(repo, tagName, hash) {
    validateTagName(tagName)

    updateReference(tagPath(repo, tagName), hash)
}

function deleteTag(repo, tagName) {
    validateTagName(tagName)

    deleteReference(tagPath(repo, tagName))
}

// Queries

function tagExists(repo, tagName) {
    validateTagName(tagName)

    return referenceExists(tagPath(repo, tagName))
}

function getTagPath(repo, tagName) {
    validateTagName(tagName)

    return tagPath(repo, tagName)
}

function getTagReference(tagName) {
    validateTagName(tagName)

    return buildReference('tags', tagName)
}

module.exports = {
    createTag,
    readTag,
    updateTag,
    deleteTag,

    tagExists,

    getTagPath,
    getTagReference,

    validateTagName
}