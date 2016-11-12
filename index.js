var ReactiveDomServer = require('./src/ReactiveDomServer.js')


exports.create = function(daoInitializer, options) {
  return new ReactiveDomSource(daoInitializer, options)
}

exports.ReactiveDomServer = ReactiveDomServer
