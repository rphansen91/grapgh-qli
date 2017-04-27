const exec = require('child_process').exec
const { createDirName, createDir, write } = require('./utils/files')
const progress = require('progress')
const output = require('./utils/output')
const noName = output.error('Must supply a project name')

const createPackage = (dir) => {
  return write(dir + '/package.json', `
{
  "name": "${dir.slice(dir.lastIndexOf('/') + 1)}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon index.js",
    "test": "echo 'Error: no test specified' && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "body-parser": "^1.17.1",
    "express": "^4.15.2",
    "graphql": "^0.9.3",
    "graphql-server-express": "^0.7.2",
    "graphql-tools": "^0.11.0",
    "node-fetch": "^1.6.3"
  }
}
`).then(() => dir)
}

const createIndex = (dir) => {
  return write(dir + '/index.js', `
const express = require('express')
const bodyParser = require('body-parser')
const { graphqlConnect, graphiqlExpress } = require('graphql-server-express')
const http = require('http')
const schema = require('./schema')

const PORT = 3000

const app = express()

app.use(bodyParser.json())

app.use('/graphql', graphqlConnect({
  schema: schema
}))

app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql'
}))

http.createServer(app).listen(PORT, () => {
  console.log('GraphiQL running: http://localhost:' + PORT + '/graphiql')
})
`).then(() => dir)
}

const createSchema = (dir) => {
  return write(dir + '/schema.js', `
const { makeExecutableSchema } = require('graphql-tools')
const schema = require('./gqli/schema')
const resolvers = require('./gqli/resolvers')

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolvers,
})
`).then(() => dir)
}

const createGqli = (dir) => {
  return createDir(dir + '/gqli/')
  .then(() => dir)
}

const createGqlAsset = name => dir => {
  const filepath = dir + '/gqli/' + name
  return createDir(filepath)
  .then(() => write(filepath + '/index.js', `
const exportDir = require('../export')

module.exports = exportDir(__dirname)
`))
  .then(() => dir)
}

const createGqlExports = dir => {
  return write(dir + '/gqli/export.js', `
const fs = require('fs')
const path = require('path')

module.exports = (dirname) => {
  return fs.readdirSync(dirname)
  .map(f => f.replace('.js', ''))
  .filter(f => f !== 'index')
  .reduce((mod, f) => {
    mod[f] = require(path.resolve(dirname, f))
    return mod
  }, {})
}
`).then(() => dir)
}

const createGqlSchema = dir => {
  return write(dir + '/gqli/schema.js', `
const Types = require('./types')
const Query = require('./query')
const Mutation = require('./mutation')

const addTypings = typings => {
  return Object.keys(typings)
  .map(t => typings[t].prototype.typing())
  .join('\\n')
}

const rootType = (name, types) => {
  if (!types) return ''
  return \`type \${name} {
  \${types}
}\`
}

const typeTypes = addTypings(Types)
const queryTypes = addTypings(Query)
const mutationTypes = addTypings(Mutation)
const schemaDefinition =
\`schema {
  \${queryTypes?'query: Query':''}
  \${mutationTypes?'mutation: Mutation':''}
}
\`

module.exports = [
  typeTypes,
  rootType('Query', queryTypes),
  rootType('Mutation', mutationTypes),
  schemaDefinition
].join('\\n')
`).then(() => dir)
}

const createGqlResolvers = dir => {
  return write(dir + '/gqli/resolvers.js', `
const Types = require('./types')
const Query = require('./query')
const Mutation = require('./mutation')
const Root = {}

if (Object.keys(Query).length) Root.Query = Query
if (Object.keys(Mutation).length) Root.Mutation = Mutation

module.exports = Object.assign(Root, Types)
`).then(() => dir)
}

const createQuery = createGqlAsset('query')
const createTypes = createGqlAsset('types')
const createMutation = createGqlAsset('mutation')

const execute = (command, cwd) => {
  return new Promise((res, rej) => {
    const execution = exec(command, { cwd })
    execution.on('error', (err) => rej(err))
    execution.on('close', (code) => res(code))
  })
}

const npmInstall = (dir) => {
  return execute('npm install', dir)
  .then(() => dir)
}

const scaffold = [
  createDir,
  createPackage,
  createIndex,
  createSchema,
  createGqli,
  createGqlExports,
  createGqlSchema,
  createGqlResolvers,
  createQuery,
  createTypes,
  createMutation,
  npmInstall
]

module.exports = function (commands) {
  const name = commands[0]

  if (!name) return output(noName)

  const dirName = createDirName(name)
  const progressBar = new progress(':bar :percent', { total: scaffold.length })

  scaffold.reduce((acc, createFile) => {
    return acc.then(createFile).then((d) => {
      progressBar.tick()
      return d
    })
  }, Promise.resolve(dirName))
  .then(() => {
    output('Created GraphQL Project: ' + output.style(dirName, 'green'))
  })
  .catch(err => {
    progressBar.terminate()
    output(output.error(err.message))
  })
}
