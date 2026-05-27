const { ValidationError } = require('../errors')

// HELPERS

function isOption(token) {
    return token.startsWith('-')
}

function normalizeOption(token) {
    return token.replace(/^-+/, '')
}

// PARSER

function parseArgs(argv) {
    if (!Array.isArray(argv)) {
        throw new ValidationError('argv must be an Array')
    }

    if (argv.length === 0) {
        return {
            command: null,
            args: [],
            options: {}
        }
    }

    const command = argv[0]
    const args = []
    const options = {}

    let index = 1

    while (index < argv.length) {
        const token = argv[index]

        // Handle options
        if (isOption(token)) {
            const optionName = normalizeOption(token)

            const next = argv[index + 1]

            // Boolean flag
            if (next === undefined || isOption(next)) {
                options[optionName] = true

                index++
                continue
            }

            // key/value option

            options[optionName] = next

            index += 2
            continue
        }

        // Positional argument
        args.push(token)
        index++
    }

    return { command, args, options }
}

// UTILITIES

/**
 * Validate command existance 
 * @param {*} parsed 
 */
function requireCommand(parsed) {
    if (!parsed.command) {
        throw new ValidationError('No command provided')
    }
}

/**
 * Require positional argument
 * @param {*} parsed 
 * @param {*} index 
 * @param {*} message 
 * @returns 
 */
function requireArgument(parsed, index, message) {
    if (!parsed.args[index]) {
        throw new ValidationError(message)
    }

    return parsed.args[index]
}

function requireOption(parsed, option, message) {
    if (!(option in parsed.options)) {
        throw new ValidationError(message)
    }

    return parsed.options[option]
}

module.exports = {
    parseArgs,
    requireCommand,
    requireArgument,
    requireOption,
    isOption,
    normalizeOption
}
