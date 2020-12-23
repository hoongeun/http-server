import stream from 'stream';

const STATUS_CODES = {
    200: 'OK'
    // ...etc...
};

const ZEROCRLFx2 = Buffer('0\r\n\r\n');
const CRLF = Buffer('\r\n');
const CRLFx2 = Buffer('\r\n\r\n');

class Response extends stream.Writable {
  constructor(req) {
    super(req)
    this.statusCode = 200;
    this._request = req;
    this._headers = {};
    this._headerKeys = {};

    this.setHeader('Date', new Date().toGMTString());

    // todo: check the req.headers and req.httpVersion first
    this.setHeader('Connection', 'keep-alive');
    this.setHeader('Transfer-Encoding', 'chunked');

    this.on('finish', this._finishEncode);
  }
  setHeader(key, value) {
    const lkey = key.toLowerCase();
    this._headers[lkey] = value;
    this._headerKeys[lkey] = key;
  }
  removeHeader(key) {
    const lkey = key.toLowerCase();
    delete this._headers[lkey];
    delete this._headerKeys[lkey];
  }
  setStatus(status) {
    this.statusCode = status;
  }
  writeHead(code, msg, headers) {
    this.statusCode = code;

    if (typeof msg === 'string') {
      this.statusMessage = msg;
    }
    else headers = msg;

    if (headers && typeof headers === 'object') {
      const keys = Object.keys(headers);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        this.setHeader(key, headers[key]);
      }
    }
  }
  _getHeader(key) {
    const lkey = key.toLowerCase();
    return this._headers[lkey];
  }
  _getHeaderBuffer() {
    const req = this._request;
    const keys = Object.keys(this._headers);
    const code = this.statusCode;

    const lines = [
      'HTTP/' + req.httpVersion + ' ' + code + ' '
        + (this.statusMessage || STATUS_CODES[code])
    ];

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      lines.push(this._headerKeys[key] + ': ' + this._headers[key]);
    }

    return Buffer(lines.join('\r\n') + '\r\n\r\n');
  }
  _write(buf, enc, next) {
    this._buffer = this._encode(buf);
    this._next = next;

    if (this._ondata) {
      this._ondata();
      this._ondata = null;
    }
  }
  _encode(buf) {
    const enc = this._getHeader('transfer-encoding');
    if (enc === 'chunked') {
      const pre = buf.length.toString(16) + '\r\n';
      return [ Buffer(pre), buf, CRLF ];
    }
    return buf;
  }
  _finishEncode() {
    const enc = this._getHeader('transfer-encoding');
    this._finished = true;

    if (enc !== 'chunked') return;

    if (this._buffer) {
      // does this case ever happen?
      if (Array.isArray(this._buffer)) {
        this._buffer.push(ZEROCRLFx2);
      }
      else {
        this._buffer = [ this._buffer, ZEROCRLFx2 ];
      }
    }
    else {
      this._buffer = ZEROCRLFx2;
    }
    if (this._ondata) this._ondata();

    if (this._onfinish) this._onfinish();
  }
}

export default Response
