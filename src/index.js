import http from 'http'
import querystring from 'querystring'
import crypto from 'crypto'
import es from 'event-stream'


class MixpanelExport {
  constructor(config) {
    this.config = {
      api_key: null,
      api_secret: null,
      default_valid_for: 60
    }

    for (let key in config) {
      this.config[key] = config[key]
    }
    if (!this.config.api_key && this.config.api_secret) {
      throw new Error('MixpanelAPI needs token and secret parameters')
    }
  }

  user_stream(params, valid_for, cb) {
    this._common({
      params,
      valid_for,
      cb,
      req: {
        host: 'mixpanel.com',
        port: 80,
        path: '/api/2.0/stream/query/'
      }
    })
  }

  export_data(params, valid_for, cb) {
    this._common({
      params,
      valid_for,
      cb,
      req: {
        host: 'data.mixpanel.com',
        port: 80,
        path: '/api/2.0/export/'
      }
    })
  }

  request(endpoint, params, valid_for, cb) {
    this._common({
      params,
      valid_for,
      cb,
      req: {
        host: 'mixpanel.com',
        port: 80,
        path: `/api/2.0/${endpoint}/`
      }
    })
  }

  _get_expire_ts() {
    let now = new Date(),
      expire = new Date((new Date()).setUTCMinutes(now.getUTCMinutes() + 5))

    return expire.getTime()
  }

  _common({params, valid_for, cb, req}) {
    if (typeof params !== 'object') {
      throw new Error('export_data(params, [valid_for], cb) expects an object params')
    }
    if (typeof cb !== 'function') {
      throw new Error('export_data(params, [valid_for], cb) expects a function cb')
    }

    valid_for = valid_for || this.config.default_valid_for

    params.api_key = this.config.api_key
    params.expire = params.expire || this._get_expire_ts()
    params = this._prep_params(params)

    req.path = req.path + '?' + querystring.stringify(this._sign_params(params))

    http.get(req, function(res) {
      res.setEncoding('utf8')
      cb(es.pipeline(
        res,
        es.split(),
        es.parse()
      ))
    })
  }

  _prep_params(params) {
    for (let p in params) {
      if (params.hasOwnProperty(p) && Array.isArray(params[p])) {
        params[p] = JSON.stringify(params[p])
      }
    }
    return params
  }

  _sign_params(params) {
    if (!params.api_key || !params.expire) {
      throw new Error('all requests must have api_key and expire')
    }
    let hash,
      keys = Object.keys(params).sort(),
      to_be_hashed = ''

    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i]
      if (key === 'callback' || key === 'sig') continue
      to_be_hashed += key + '=' + params[key]
    }

    hash = crypto.createHash('md5')
    hash.update(to_be_hashed + this.config.api_secret)
    params.sig = hash.digest('hex')
    return params
  }
}

export default function (config) {
  return new MixpanelExport(config)
}
