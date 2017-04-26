/*global describe test expect*/

const { compose, pipe, curry } = require('./compose')
const inc = v => v + 1
const double = v => v * 2

describe('Function Composition', () => {

  test('pipe', () => {
    const incThenDouble = pipe(inc, double)
    expect(incThenDouble(1)).toBe(4)
  })

  test('compose', () => {
    const doubleThenInc = compose(inc, double)
    expect(doubleThenInc(1)).toBe(3)
  })

})

describe('Function Currying', () => {

  const curried = curry(function (a, b, c) {
    return a + b + c
  })

  test('apply arguments 1 at a time', () => {
    expect(curried(1)(2)(3)).toBe(6)
  })

  test('apply arguments all at once', () => {
    expect(curried(1, 2, 3)).toBe(6)
  })

})
