const { body, validationResult } = require('express-validator')
const { formatValidationErrors } = require('../../../utils.js')
const async = require('async');
const request = require('request');
const geoLib = require('geolib');

const londonCoors = {
  latitude: '51.509865',
  longitude: '-0.118092'
}

function httpGet(url, callback) {
  const options = {
    url :  url,
    json : true
  }
  request(options,
    (err, res, body) => {
      callback(err, body);
    }
  )
}

module.exports = (app) => {
  app.post(
    '/full-page-examples/distance-from-london',
    [
      // body('distance').exists().not().isEmpty().withMessage('Enter a distance'),
      body('distance').custom((value) => {
        if (!value || value.length < 1) {
          throw new Error('Enter a distance');
        }
        if (isNaN(value)) {
          throw new Error('Distance must be a number');
        }
        if (value.length > 2) {
          throw new Error('Distance must be 1-2 digits.');
        }
        // Indicates the success of this synchronous custom validator
        return true;
      })
    ],
    (request, response) => {
      const distance = request.body.distance;
      const errors = formatValidationErrors(validationResult(request))
      if (errors) {
        return response.render(
          './full-page-examples/distance-from-london/index', {
            errors,
            errorSummary: Object.values(errors),
            values: request.body, // In production this should sanitized.
          })
      }
      async.map([
        'https://dwp-techtest.herokuapp.com/users',
        'https://dwp-techtest.herokuapp.com/city/London/users',
      ], httpGet, (err, res) => {
        if (err) {
          return response.render(
            './full-page-examples/distance-from-london/index', {
              errors,
              errorSummary: Object.values(errors),
              values: request.body, // In production this should sanitized.
            })
        }
        const distanceUsers = res[0].filter((user) =>
          Math.round((geoLib.getDistance(londonCoors,{ latitude: user.latitude, longitude: user.longitude }) / 1000 * 0.621371) * 100) / 100 < distance)
        const londonUsers = res[1]
        response.render('./full-page-examples/distance-from-london/confirm', {
          distance,
          londonUsers,
          distanceUsers
        })
      })
    },
  )
}
