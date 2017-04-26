#! /usr/bin/env node

require('dotenv').config()
require('./utils/proto')

const commands = process.argv.slice(2)
const help = require('./help')
const create = require('./create')
const query = require('./query')
const mutation = require('./mutation')

const mainCommands = {
  help: help,
  create: create,
  query: query,
  mutation: mutation
}

const main = mainCommands[commands[0]]
if (!main) mainCommands.help()
else main(commands.slice(1))
