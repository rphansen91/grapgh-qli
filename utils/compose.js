function pipe () {
  const fns = Array.from(arguments)
  return function (v) {
    return fns.reduce(function (acc, fn) {
      return fn(acc)
    }, v)
  }
}

function compose () {
  const fns = Array.from(arguments)
  return function (v) {
    return fns.reduceRight(function (acc, fn) {
      return fn(acc)
    }, v)
  }
}

function curry (fn) {
  return function curried () {
    const args = Array.from(arguments)
    if (args.length >= fn.length) {
      return fn.apply(null, args)
    }
    return curried.bind.apply(curried, [this].concat(args))
  }
}

module.exports = {
  compose,
  pipe,
  curry
}
