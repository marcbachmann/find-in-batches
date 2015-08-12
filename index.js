var async = require('async')
var assert = require('assert')

var typeAssert = function (value, type, name) {
  assert(typeof value === type, 'The argument ' + name + ' must be a ' + type + ': findInBatches(findMethod, [options], each, callback)')
}

module.exports = function (options, find, each, callback) {
  if (arguments.length === 3) {
    callback = each
    each = find
    find = options
    options = {}
  }

  if (options) typeAssert(options, 'object', 'options')
  typeAssert(find, 'function', 'find')
  typeAssert(each, 'function', 'each')
  typeAssert(callback, 'function', 'callback')
  assert(find.length === 2, "The method 'find' must consist of two arguments: findMethod(options, callback)")
  assert(each.length === 2, "The method 'each' must consist of two arguments: each(data, callback)")

  options = options || {}
  var maximum = options.maximum || Infinity
  var offset = options.offset || 0
  var limit = options.batchSize || 50
  var concurrency = options.concurrency || Infinity
  var page = 1
  var limitExceeded = false
  var processedDocuments = 0

  async.until(function () {
    return limitExceeded || (processedDocuments >= maximum)
  }, function (done) {
    find({
      offset: offset,
      limit: limit,
      page: page
    }, function (err, docs) {
      if (err) return done(err)
      if (!docs || docs.length !== limit) limitExceeded = true
      page += 1
      offset += limit
      processedDocuments += limit
      return async.eachLimit(docs, concurrency, each, done)
    })
  }, callback)
}
