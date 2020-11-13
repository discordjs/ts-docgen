#!/usr/bin/env node
import yargs from 'yargs'
import { version, homepage } from '../package.json'

const options = yargs
  .usage('$0 [command] [options]')
  .example('$0 --source src --custom docs --output docs/docs.json', 'Default usage')
  .example('$0 --config docgen.yml', 'Runs the generator using a config file')
  .example('$0 completion', 'Outputs Bash completion script')
  .epilogue(`discord.js-docgen v${version} by Amish Shah (Hydrabolt) and Schuyler Cebulskie (Gawdl3y): ${homepage}`)

  .option('source', {
    type: 'array',
    alias: ['s', 'i'],
    describe: 'Source directories to parse TypeDoc in',
    normalize: true
  })
  .option('existingOutput', {
    type: 'string',
    alias: 'eo',
    describe: 'Path ot an existing TypeDoc JSON output file',
    normalize: true
  })
  .option('custom', {
    type: 'string',
    alias: 'c',
    describe: 'Custom docs definition file to use',
    normalize: true
  })
  .option('root', {
    type: 'string',
    alias: 'r',
    describe: 'Root directory of the project',
    normalize: true,
    default: '.'
  })
  .option('output', {
    type: 'string',
    alias: 'o',
    describe: 'Path to output file',
    normalize: true
  })
  .option('spaces', {
    type: 'number',
    alias: 'S',
    describe: 'Number of spaces to use in output JSON',
    default: 0
  })
  .option('verbose', {
    type: 'boolean',
    alias: 'V',
    describe: 'Logs extra information to the console',
    default: false
  })

  .option('config', {
    type: 'string',
    alias: 'C',
    describe: 'Path to JSON/YAML config file',
    group: 'Special:',
    normalize: true,
    config: true,
    configParser: configFile => {
      const extension = require('path').extname(configFile).toLowerCase()
      if (extension === '.json') {
        return JSON.parse(require('fs').readFileSync(configFile))
      } else if (extension === '.yml' || extension === '.yaml') {
        return require('js-yaml').safeLoad(require('fs').readFileSync(configFile))
      }
      throw new Error('Unknown config file type.')
    }
  })

  .help()
  .alias('help', 'h')
  .group('help', 'Special:')
  .version(version)
  .alias('version', 'v')
  .group('version', 'Special:')
  .completion('completion')
  .wrap(yargs.terminalWidth())
  .argv

if ((!options.source || options.source.length < 1) === !options.existingOutput)
  throw new Error('You need to use either --source or --existingOutput')

export default options
