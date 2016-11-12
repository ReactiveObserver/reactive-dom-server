var SockJS = require("sockjs")
var rd = require("reactive-dom")

class ReactiveDomServer {
  constructor(daoInitializer, options) {
    this.daoInitializer = daoInitializer
    this.sockjs = sockjs.createServer(options)
    sockjs.on('connection', conn => this.handleConnection(conn))
  }
  handleConnection(connection) {
    var dao
    var observers = new Map()
    connection.on('data', data => {
      var message = JSON.parse(data)
      if(!dao) {
        if(message.type != 'initializeSession') {
          console.error("Unknown first packet type "+message.type)
          connection.close()
          return;
        }
        dao = rd.createDAO([], message.sessionId, { stateless: false })
        this.daoInitializer(dao)
      } else {
        switch(message.type) {
          case 'request':
            var path = message.to.concat([message.method])
            dao.request(path, message.args).then(
              result => connection.write(JSON.stringify({
                type:"response",
                responseId: request.requestId,
                response: result
              })),
              error => connection.write(JSON.stringify({
                type:"error",
                responseId: request.requestId,
                error: error
              }))
            );
            break;
          case 'ping':
            message.type = 'pong'
            connection.write(JSON.stringify(message))
            break;
          case 'timeSync':
            message.server_send_ts = Date.now()
            message.server_recv_ts = Date.now()
            connection.write(JSON.stringify(message))
            break;
          case 'event':
            var path = message.to.concat([message.method])
            dao.request(path, message.args)
            break;
          case 'observe' :
            var path = message.to.concat([message.what])
            var spath = JSON.stringify(path)
            var observer = observers.get(spath)
            if(observer) return;
            var observable = dao.observable(path)
            var observer = (signal, ...params) => connection.write(JSON.stringify({
              type: "notify",
              from: message.to,
              what: message.what,
              signal: signal,
              args: params
            }))
            observable.observe(observer)
            observers.set(spath, observer)
            break;
          case 'unobserve' :
            var path = message.to.concat([message.what])
            var spath = JSON.stringify(path)
            var observer = observers.get(spath)
            if(!observer) return;
            var observable = dao.observable(path)
            observable.unobserve(observer)
            observers.delete(spath)
            break;
          case 'get' :
            console.error("GET OPERATION NOT SUPPORTED")
            connection.close();
            return;
        }
      }
    });
    conn.on('close', () => dao.dispose());
  }
}

module.exports = SockJsConnection
