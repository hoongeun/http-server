import stream from 'stream'
import Request from './request.js';
import Response from './response.js';

const states = { METHOD: 0, KEY: 1, VALUE: 2, BODY: 3 };
const CR = 0x0D;
const LF = 0x0A;

class HttpHandler extends stream.Duplex {
  constructor(cb) {
    super()
    this.request = new Request;
    this._state = states.METHOD;
    this._lastIndex = 0;
    this._cb = cb;
  }
  _prepareRequest() {
    const self = this;
    this._state = states.BODY;
    const req = this.request;
    const res = this.response = new Response(req);
    res._onfinish = () => {
      if (res._buffer) {
        const buf = res._buffer
        res._buffer = null;
        self.push(buf);
      }
      self.push(null);
    };

    this._prev = null;
    this._cb(req, res);

    if (this._ready) {
      this._ready = false;
      this._read();
    }
  }
  _read() {
    const self = this;
    const res = this.response;

    if (!res) {
      this._ready = true;
    }
    else if (res._buffer) {
      let buf = res._buffer;
      if (Array.isArray(buf)) {
        buf = Buffer.concat(buf);
      }
      const next = res._next;

      res._buffer = null;
      res._next = null;

      if (!this._sentHeader) {
        this._sentHeader = true;
        this.push(Buffer.concat([ res._getHeaderBuffer(), buf ]));
      }
      else this.push(buf);

      if (next) next();
    }
    else {
      res._ondata = () => { self._read() };
    }
  }
  _write(buf, enc, next) {
    if (this._state === states.BODY) {
        return next();
    }

    const req = this.request;
    let i = 0;
    if (this._prev) {
        buf = Buffer.concat([ this._prev, buf ]);
        i = this._prev.length;
        this._prev = null;
    }
    for (const len = buf.length; i < len; i++) {
        if (i >= 1 && buf[i] === LF && buf[i-1] === LF) {
            this._prepareRequest();
        }
        if (i >= 2 && buf[i] === LF && buf[i-1] === CR
        && buf[i-2] === LF) {
            this._prepareRequest();
        }
        else if (buf[i] === LF) {
            if (this._state === states.METHOD) {
                const parts = buf.slice(0, i).toString('utf8').trim().split(' ');
                req._setMethod(parts[0]);
                req._setUrl(parts[1]);
                req._setVersion(parts[2]);
                this._state = states.KEY;
                this._lastIndex = i;
            }
            else if (this._state === states.VALUE) {
                req._setHeader(this._keyName, buf.slice(this._lastIndex, i));
                this._keyName = null;
                this._lastIndex = i;
                this._state = states.KEY;
            }
            else if (this._state === states.KEY) {
                this._lastIndex = i;
            }
        }
        else if (this._state === states.KEY && buf[i] === 58) {
            this._keyName = buf.slice(this._lastIndex, i);
            this._lastIndex = i + 1;
            this._state = states.VALUE;
        }
    }

    if (this._state !== states.BODY) {
        this._prev = buf;
    }

    next();
  }
}

export default HttpHandler;
