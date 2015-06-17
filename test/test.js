import { expect }  from 'chai'
import mixpanelExport from '../src/index'
import fs from 'fs'


var api_key,
  api_secret

if (exists('../src/config.local.js')) {
  var config = require('../src/config.local.js')
  api_key = config.api_key
  api_secret = config.api_secret
} else {
  api_key = 'YOUR_MIXPANEL_API_KEY'
  api_secret = 'YOUR_MIXPANEL_API_SECRET'
}

describe('mixpanel-export basics', function () {
  it('should exist', function () {
    expect(mixpanelExport).to.be.function
  })

  it('should get a list of user events', function () {
    let mx = mixpanelExport({
      api_key: api_key,
      api_secret: api_secret
    })


    let params = {
      'from_date':'2015-04-16',
      'to_date': '2015-06-16',
      'distinct_ids': '["14ded11fad433d-03cfde0c7-304d5665-100200-14ded11fad524a"]',
      'limit': 1000
    }

    mx.user_stream(params, 100, function(res) {
      res.on('data', function(e) {
        if (e.error) console.log('Error appeared: ', e.error)
        if (!e.results.events) return
        console.log(e.results.events)
      })

      res.on('end', function() {
        console.log('All events have been retrieved users');
      })
    })

  })
})

function exists( name ) {
  try { return require.resolve( name ) }
  catch( e ) { return false }
}
