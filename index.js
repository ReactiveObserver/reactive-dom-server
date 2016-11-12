var ReactiveDomServer = require('./src/ReactiveDomServer.js')


exports.create = function(daoInitializer, options) {
  return new ReactiveDomServer(daoInitializer, options)
}

exports.ReactiveDomServer = ReactiveDomServer
