import got from 'got'

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'
const REFERER = 'https://live.bilibili.com'

export default class Client {
  constructor (options = {}) {
    this._cookie = options.cookie || ''
    this._userAgent = options.userAgent || USER_AGENT
    this._referer = options.referer || REFERER
  }

  getCSRFToken () {
    if (!this._cookie) return ''
    let token = ''
    this._cookie.split(';').some(p => {
      const [k, v] = p.split('=')
      if (k === 'bili_jct') {
        token = v
      }
    })
    return token
  }

  getDefaultHeaders () {
    return {
      cookie: this._cookie,
      'user-agent': this._userAgent,
      referer: this._referer
    }
  }

  get (url, options) {
    const getOptions = Object.assign({}, options, {
      headers: Object.assign(options ? options.headers || {} : {}, this.getDefaultHeaders())
    })
    return got.get(url, getOptions).text()
  }

  getJSON (url, options) {
    const getOptions = Object.assign({}, options, {
      headers: Object.assign(options ? options.headers || {} : {}, this.getDefaultHeaders())
    })
    return got.get(url, getOptions).json()
  }

  post (url, options) {
    const postOptions = Object.assign({}, options, {
      headers: Object.assign(options ? options.headers || {} : {}, this.getDefaultHeaders())
    })
    return got.post(url, postOptions).json()
  }
}
