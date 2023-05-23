
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./mobx-keystone-persist.cjs.production.min.js')
} else {
  module.exports = require('./mobx-keystone-persist.cjs.development.js')
}
