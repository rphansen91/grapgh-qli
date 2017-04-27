const fs = require('fs')
const path = require('path')
const currentDir = process.cwd()
const createDirName = name => path.resolve(currentDir, name)

function isDir (dir) {
  return new Promise((res) => {
    fs.stat(dir, (err, data) => {
      if (data) res(true)
      res(false)
    })
  })
}

function createDir (dir) {
  return new Promise((res, rej) => {
    fs.mkdir(dir, (err) => {
      if (err) rej(err)
      res(dir)
    })
  })
}

function write (filepath, contents) {
  return new Promise((res, rej) => {
    fs.writeFile(filepath, contents, 'utf-8', (err) => {
      if (err) rej(err)
      res(true)
    })
  })
}

module.exports = {
  createDirName,
  createDir,
  isDir,
  write
}
