const hbs = require('express-hbs')

hbs.registerHelper('stringify', function (obj) {
  return JSON.stringify(obj, null, 2)
})
