"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var http = _interopRequire(require("http"));

var querystring = _interopRequire(require("querystring"));

var crypto = _interopRequire(require("crypto"));

var es = _interopRequire(require("event-stream"));

var MixpanelExport = (function () {
  function MixpanelExport(config) {
    _classCallCheck(this, MixpanelExport);

    this.config = {
      api_key: null,
      api_secret: null,
      default_valid_for: 60
    };

    for (var key in config) {
      this.config[key] = config[key];
    }
    if (!this.config.api_key && this.config.api_secret) {
      throw new Error("MixpanelAPI needs token and secret parameters");
    }
  }

  _createClass(MixpanelExport, {
    user_stream: {
      value: function user_stream(params, valid_for, cb) {
        this._common({
          params: params,
          valid_for: valid_for,
          cb: cb,
          req: {
            host: "mixpanel.com",
            port: 80,
            path: "/api/2.0/stream/query/"
          }
        });
      }
    },
    export_data: {
      value: function export_data(params, valid_for, cb) {
        this._common({
          params: params,
          valid_for: valid_for,
          cb: cb,
          req: {
            host: "data.mixpanel.com",
            port: 80,
            path: "/api/2.0/export/"
          }
        });
      }
    },
    request: {
      value: function request(endpoint, params, valid_for, cb) {
        this._common({
          params: params,
          valid_for: valid_for,
          cb: cb,
          req: {
            host: "mixpanel.com",
            port: 80,
            path: "/api/2.0/" + endpoint + "/"
          }
        });
      }
    },
    _get_expire_ts: {
      value: function _get_expire_ts() {
        var now = new Date(),
            expire = new Date(new Date().setUTCMinutes(now.getUTCMinutes() + 5));

        return expire.getTime();
      }
    },
    _common: {
      value: function _common(_ref) {
        var params = _ref.params;
        var valid_for = _ref.valid_for;
        var cb = _ref.cb;
        var req = _ref.req;

        if (typeof params !== "object") {
          throw new Error("export_data(params, [valid_for], cb) expects an object params");
        }
        if (typeof cb !== "function") {
          throw new Error("export_data(params, [valid_for], cb) expects a function cb");
        }

        valid_for = valid_for || this.config.default_valid_for;

        params.api_key = this.config.api_key;
        params.expire = params.expire || this._get_expire_ts();
        params = this._prep_params(params);

        req.path = req.path + "?" + querystring.stringify(this._sign_params(params));

        http.get(req, function (res) {
          res.setEncoding("utf8");
          cb(es.pipeline(res, es.split(), es.parse()));
        });
      }
    },
    _prep_params: {
      value: function _prep_params(params) {
        for (var p in params) {
          if (params.hasOwnProperty(p) && Array.isArray(params[p])) {
            params[p] = JSON.stringify(params[p]);
          }
        }
        return params;
      }
    },
    _sign_params: {
      value: function _sign_params(params) {
        if (!params.api_key || !params.expire) {
          throw new Error("all requests must have api_key and expire");
        }
        var hash = undefined,
            keys = Object.keys(params).sort(),
            to_be_hashed = "";

        for (var i = 0, len = keys.length; i < len; i++) {
          var key = keys[i];
          if (key === "callback" || key === "sig") continue;
          to_be_hashed += key + "=" + params[key];
        }

        hash = crypto.createHash("md5");
        hash.update(to_be_hashed + this.config.api_secret);
        params.sig = hash.digest("hex");
        return params;
      }
    }
  });

  return MixpanelExport;
})();

module.exports = function (config) {
  return new MixpanelExport(config);
};