import { createHttpServer } from './server';
import fs from 'fs';
import path from 'path';
import MobileDetect from 'mobile-detect';

const server = createHttpServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.url == '/') {
    const md = new MobileDetect(req.headers['user-agent'])
    const page = md.mobile() ? 'static/mobile.html' : 'static/desktop.html'
    const filePath = path.resolve(path.join('.', page))
    fs.createReadStream(filePath).pipe(res);
  } else if (req.url === '/static/desktop.jpg') {
    const filePath = path.resolve(path.join('.', req.url))
    fs.createReadStream(filePath).pipe(res);
  } else if (req.url === '/static/mobile.jpg') {
    const filePath = path.resolve(path.join('.', req.url))
    fs.createReadStream(filePath).pipe(res);
  } else if (req.url === '/favicon.ico') {
    const filePath = path.resolve(path.join('.', 'static', req.url))
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(3333);
