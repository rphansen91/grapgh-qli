function output (message, styles) {
  if (!styles) return process.stdout.write(`${message}\n`)
  return output(output.style(message, styles))
}

output.error = function (message) {
  return output.style('\nErr:\n'+message+'\n', 'red')
}

output.style = function (m, s) {
  if (typeof s === 'string') {
    return styleize(s.split(','))
  }
  return styleize(s)

  function styleize (s) {
    return (s || [])
    .map(trim)
    .filter(valid)
    .reduce(style, m)
  }
}

function style (m, s) {
  return `\x1b[${output[s]}${m}\x1b[0m`
}

function valid (s) {
  return output[s]
}

function trim (s) {
  return (s || '').trim()
}

output.bold = '1m'
output.italic = '3m'
output.underline = '4m'
output.strikethrough = '5m'
output.black = '30m'
output.red = '31m'
output.green = '32m'
output.yellow = '33m'
output.blue = '34m'
output.magenta = '35m'
output.cyan = '36m'
output.white = '37m'
output.bg_black = '40m'
output.bg_red = '41m'
output.bg_green = '42m'
output.bg_yellow = '43m'
output.bg_blue = '44m'
output.bg_magenta = '45m'
output.bg_cyan = '46m'
output.bg_white = '47m'

module.exports = output
