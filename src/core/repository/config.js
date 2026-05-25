const fs = require('fs')

const logger = require('../../utils/logger')

function readConfig(repo) {
    const configPath = repo.paths.config

    if (!fs.existsSync(configPath)) {
        return {}
    }

    const raw = fs.readFileSync(configPath, 'utf8')

    try {
        return JSON.parse(raw)
    } catch (error) {
        logger.error(error.stack)
        throw new Error(`Invalid repository config: ${error.message}`)
    }
}

function writeConfig(repo, config) {
    const configPath = repo.paths.config

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function getConfigValue(repo, key, defaultValue=null) {
    const config = readConfig(repo)

    return key in config ? config[key] : defaultValue
}

function setConfigValue(repo, key, value) {
    const config = readConfig(repo)

    config[key] = value

    writeConfig(repo, config)
}

module.exports = {
    readConfig,
    writeConfig,
    getConfigValue,
    setConfigValue
}