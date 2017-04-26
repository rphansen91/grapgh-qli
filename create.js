// const fs = require('fs')
const path = require('path')
const output = require('./utils/output')
const noName = output.error('Must supply a project name')
const currentDir = process.cwd()
const createDirName = name => path.resolve(currentDir, name)

module.exports = function (commands) {
  const name = commands[0]

  if (!name) return output(noName)

  output('Current directory: ' + output.style(createDirName(name), 'green'))
}
