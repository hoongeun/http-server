import net from 'net';
import HttpHandler from './httpHandler';

class HttpServer extends net.Server {
  constructor() {
    super()
    this.on('connection', (stream) => {
      stream.on('error', () => {});
      const hh = new HttpHandler((req, res) => {
        this.emit('request', req, res);
      });
      stream.pipe(hh).pipe(stream);
    });
  }
}

export default HttpServer;
export const createHttpServer = (cb) => {
  const server = new HttpServer;
  if (cb) {
    server.on('request', cb);
  }
  return server;
}
