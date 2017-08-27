import http from 'http'
import https from 'https'
import url from 'url'
import qs from 'querystring'

function dispatchRequest(useHttps, options, postData) {
  let sender = http
  if (useHttps) {
    sender = https
  }
  return new Promise(function(resolve, reject) {
    let req = sender.request(options, (res) => {
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

export function get(requestUrl, config = {}) {
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
  if (parsed.protocol == 'https:') {
    return dispatchRequest(true, options)
  } else {
    return dispatchRequest(false, options)
  }

}

export function post(requestUrl, config = {}) {
  let postData = typeof config.body == 'string'
    ? config.body
    : JSON.stringify(config.body || {})
  let parsed = url.parse(requestUrl)
  let options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.path,
    method: 'POST',
    headers: Object.assign({
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }, config.headers)
  }
  if (parsed.protocol == 'https:') {
    return dispatchRequest(true, options, postData)
  } else {
    return dispatchRequest(false, options, postData)
  }
}
