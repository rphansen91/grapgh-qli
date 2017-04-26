const fs = require('fs')
const path = require('path')
const output = require('./utils/output')
const formatMD = require('./utils/md')

const help = fs.readFileSync(path.resolve(__dirname, 'README.md'), 'utf-8')
const helpOutput = formatMD(help)

module.exports = function () {
  return output(helpOutput)
}
