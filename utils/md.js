const output = require('./output')

const md = {
  underline: /\#\#\ (.*)/,
  bold: /\#\ (.*)/,
  green: /\`(.*)\`/
}

const styleline = text => {
  if (!text) return ''

  return Object.keys(md)
  .filter(type => text.match(md[type]))
  .reduce((acc, type) => {
    const [before, after] = acc.match(md[type]) || []
    if (after) return acc.replace(before, output.style(after, type))
    return acc
  }, text || '')
}

module.exports = function (text) {
  return text
  .split('\n')
  .map(styleline)
  .join('\n')
}
