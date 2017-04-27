const { createDirName, write, isDir } = require('./utils/files')
const inquirer = require('inquirer')
const fetch = require('node-fetch')
const output = require('./utils/output')
const noName = output.error('Must supply a query name')

function findMainTypes (data) {
  if (Array.isArray(data[0])) {
    const type = findTypes(data[0][0])
    return inquirer.prompt({
      type: 'input',
      name: 'name',
      message: 'What is the name of this type? \n' + buildTypes('{{type_name}}', buildArgs(type))
    }).then(({ name }) => [type, data[1], name])
  } else {
    return Promise.resolve([findTypes(data[0]), data[1]])
  }
}

function findTypes (data) {

  function findType (key, val) {
    if (Array.isArray(val)) {
      return '['+findType(key, val[0] || '')+']'
    }
    if (typeof val === 'object') {
      return findTypes(val)
    }
    if (typeof val === 'string') {
      if (val && !isNaN(Number(val))) return 'Int'
      return 'String'
    }
    if (typeof val === 'number') {
      return 'Int'
    }
  }

  if (Array.isArray(data)) {
    return '[' + findTypes(data[0]) + ']'
  }

  if (data && typeof data === 'object') {
    return Object.keys(data || {})
    .filter(key => findType(key, data[key]))
    .reduce((acc, key) => {
      acc[key] = findType(key, data[key])
      return acc
    }, {})
  }
}

function capital (str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function buildArgs (args) {
  return Object.keys(args || {})
  .map(key => key + ': ' + args[key])
}

function buildTypes (name, types) {
  return [
    'type ' + name + ' {',
    '\t' + types.join('\n\t'),
    '}'
  ].join('\n')
}

function buildQueryFile (name, url, args, type, selector) {
  return `const fetch = require('node-fetch')

function ${name} (obj, args, context, info) {
  const { ${Object.keys(args || {}).join(', ')} } = args
  return fetch('${url}')
  .then(res => res.json())
  ${selector ? `.then(res => res.${selector})`:''}
}

${name}.prototype.typing = () => '${name}(${buildArgs(args).join(', ')}): ${type}'

module.exports = ${name}`
}

function buildTypeFile (name, types) {
  return `function ${name} () {}

${name}.prototype.typing = () =>
\`${buildTypes(name, types)}\`

module.exports = ${name}`
}

function find (url) {
  return fetch(url)
  .then(res => res.json())
}

function resolve (res, accSelector) {
  accSelector = accSelector || ''
  return inquirer.prompt([{
    type: 'list',
    name: 'selector',
    message: 'Select the key to resolve',
    choices: ['.'].concat(Object.keys(res || {}))
  }])
  .then(({ selector }) => {
    if (selector === '.') return [res, accSelector]
    if (!accSelector) return resolve(res[selector], selector)
    return resolve(res[selector], accSelector + '.' + selector)
  })
}

function findQuery (url) {
  return url.split('{')
  .filter(t => ~t.indexOf('}'))
  .map(t => t.split('}')[0].split(':'))
  .reduce((q, c) => {
    q[c[0]] = c[1]
    return q
  }, {})
}

function makeUrl (url) {
  var query = findQuery(url)
  return Object.keys(query)
  .reduce((u, q) => {
    return u.replace('{'+q+':'+query[q]+'}', '\'+' + q + '+\'')
  }, url)
}

function executableUrl (url) {
  var query = findQuery(url)
  return Object.keys(query)
  .reduce((u, q) => {
    return u.replace('{'+q+':'+query[q]+'}',query[q])
  }, url)
}

module.exports = function (commands) {
  const name = commands[0]

  if (!name) return output(noName)

  inquirer.prompt([{
    type: 'input',
    name: 'url',
    message: 'What is the url of your endpoint\n `http://swapi.co/api/people/{id: 1}/`'
  }])
  .then(({ url }) => url.replace(/\ /g, ''))
  .then((url) => Promise.all([
    makeUrl(url),
    findTypes(findQuery(url)),
    find(executableUrl(url)).then(resolve).then(findMainTypes)
  ]))
  .then(([url, query, data]) => {
    const types = data[0]
    const queryDir = createDirName('gqli/query')
    const typesDir = createDirName('gqli/types')

    return Promise.all([
      isDir(queryDir),
      isDir(typesDir)
    ])
    .then((dirs) => {
      if (!dirs[0]) return output(output.error('Not Found ' + queryDir))
      if (!dirs[1]) return output(output.error('Not Found ' + typesDir))

      const queryFile = queryDir+'/'+name+'.js'
      const typesFile = typesDir+'/'+(data[2] || capital(name))+'.js'

      write(queryFile, buildQueryFile(name, url, query, data[2] ? '['+data[2]+']' : capital(name), data[1]))
      .then(() => output('Saved new query to: ' + output.style(queryFile, 'green')))

      write(typesFile, buildTypeFile(data[2] || capital(name), buildArgs(types)))
      .then(() => output('Saved new type to: ' + output.style(typesFile, 'green')))
    })
  })
  .catch(err => {
    console.log(err)
    output(output.error(err.message))
  })
}
