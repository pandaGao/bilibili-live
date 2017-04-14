import http from 'http'
import url from 'url'
import qs from 'querystring'

function get (requestUrl, config = {}) {
  let parsed = url.parse(requestUrl)
  let options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname,
    method: 'GET'
  }
  let params = qs.stringify(config.params)
  if (params) {
    options.path += '?' + params
  }
  if (config.headers) {
    options.headers = config.headers
  }
  return dispatchRequest(options)
}

function post (requestUrl, config = {}) {
  let postData = typeof config.body == 'string'
    ? config.body
    : JSON.stringify(config.body || {})
  let parsed = url.parse(requestUrl)
  let options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.path,
    method: 'POST',
    headers: Object.assign({}, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }, config.headers)
  }
  return dispatchRequest(options, postData)
}

function dispatchRequest (options, postData) {
  return new Promise(function(resolve, reject) {
    let req = http.request(options, (res) => {
      const statusCode = res.statusCode
      if (statusCode !== 200) {
        reject(new Error(`Request failed with status code ${statusCode}`))
      }
      res.setEncoding('utf8')
      let rawData = ''
      res.on('error', (e) => reject(e))
      res.on('data', (chunk) => rawData += chunk)
      res.on('end', () => {
        resolve(rawData)
      })
    })
    req.on('error', (e) => {
      reject(e)
    })
    if (options.method === 'POST') {
      req.write(postData)
    }
    req.end()
  })
}

export default {
  get,
  post
}
