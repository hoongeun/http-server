class Request {
  constructor() {
    this.headers = {};
  }
  _setMethod(m) {
    this.method = m;
  }
  _setHeader(key, value) {
    if (typeof key !== 'string') key = key.toString('utf8');
    if (typeof value !== 'string') value = value.toString('utf8');
    this.headers[key.trim().toLowerCase()] = value.trim();
  }
  _setUrl(u) {
    this.url = u;
  }
  _setVersion(version) {
    const hparts = version.split('/');
    if (hparts[0].toUpperCase() !== 'HTTP') {
      return this._error('invalid http version');
    }
    this.httpVersion = hparts[1];
    this.httpVersionMajor = hparts[1];
  }
}

export default Request;
