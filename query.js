const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const fetch = require('node-fetch')
const output = require('./utils/output')
const noName = output.error('Must supply a query name')
const currentDir = process.cwd()
const createDirName = name => path.resolve(currentDir, name)

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
    return findTypes(data[0])
  }

  if (typeof data === 'object') {
    return Object.keys(data)
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

function buildQueryFile (name, url, args, type) {
  return `const fetch = require('node-fetch')

function ${name} (obj, args, context, info) {
  const { ${Object.keys(args || {}).join(', ')} } = args
  return fetch('${url}')
  .then(res => res.json())
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

function isDir (dir) {
  return new Promise((res) => {
    fs.stat(dir, (err, data) => {
      if (data) res(true)
      res(false)
    })
  })
}

function write (filepath, contents) {
  return new Promise((res) => {
    fs.writeFile(filepath, contents, 'utf-8', (err) => {
      if (err) res(false)
      res(true)
    })
  })
}

function find (url) {
  return fetch(url)
  .then(res => res.json())
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
    find(executableUrl(url))
  ]))
  .then(([url, query, data]) => {
    const types = findTypes(data)
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
      const typesFile = typesDir+'/'+capital(name)+'.js'

      write(queryFile, buildQueryFile(name, url, query, capital(name)))
      .then((saved) => {
        if (saved) output('Saved new query to: ' + output.style(queryFile, 'green'))
      })

      write(typesFile, buildTypeFile(capital(name), buildArgs(types)))
      .then(saved => {
        if (saved) output('Saved new type to: ' + output.style(typesFile, 'green'))
      })
    })
  })
  .catch(err => output(output.error(err.message)))
}
