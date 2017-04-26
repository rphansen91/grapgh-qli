Promise.prototype.log = function (l) {
  return this.then(function (v) {
    console.info(l, v)
    return v
  })
}

Promise.prototype.err = function (l) {
  return this.catch(function (e) {
    console.info(l, e)
  })
}
