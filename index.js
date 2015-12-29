var eachLimit = require('async').eachLimit
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

  var cb = callback
  var callbacked = 0
  callback = function (err) { if (!callbacked++) cb(err) }

  var maximum = options.maximum || Infinity
  var offset = options.offset || 0
  var limit = options.batchSize || 50
  var concurrency = options.concurrency || Infinity
  var page = 1
  var limitExceeded = false
  var processedDocuments = 0
  var queue = []
  var isProcessing = false
  var isFetching = false

  function fetch () {
    if (callbacked || isFetching) return
    if (limitExceeded) return callback(null)
    isFetching = true
    find({offset: offset, limit: limit, page: page}, function (err, docs) {
      isFetching = false
      if (err) return callback(err)
      if (!docs || docs.length < limit) limitExceeded = true
      page += 1
      offset += limit
      processedDocuments += limit
      var tooMany = processedDocuments >= maximum
      if (tooMany) {
        docs = docs.slice(0, docs.length - (processedDocuments - maximum))
        limitExceeded = true
      }
      queue = queue.concat(docs)
      process()
    })
  }

  function process () {
    if (isProcessing) return
    isProcessing = true
    var completed = 0
    var docs = queue
    queue = []
    eachLimit(docs, concurrency, function (doc, done) {
      if (!completed++ && !limitExceeded) fetch()
      each(doc, done)
    }, function (err) {
      isProcessing = false
      if (err) return callback(err)
      // fetch()
      if (queue.length == 0) fetch()
      else process()
    })

  }

  fetch()
}

