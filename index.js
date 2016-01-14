var assert = require('assert')

module.exports = api
function api () {
  console.log('deprecated: findInBatches changed the api. Please use findInBatches.each.')
  findInBatchesEach.apply(null, arguments)
}
api.each = findInBatchesEach
api.batch = findInBatches
api.all = findInBatchesAll

var eachLimit = require('async').eachLimit
function findInBatchesEach (options, find, each, callback) {
  if (typeof callback !== 'function') {
    callback = each
    each = find
    find = options
    options = {}
  }

  var concurrency = options.concurrency || Infinity
  var eachItem = function (arr, callback) { eachLimit(arr, concurrency, each, callback)}
  findInBatches(options, find, eachItem, callback)
}

function findInBatchesAll (options, find, callback) {
  if (typeof callback !== 'function') {
    callback = find
    find = options
    options = {}
  }

  var all = []
  findInBatches(options, find, function (elems, cb) {
    append(all, elems)
    cb()
  }, function (err) {
    if (err) return callback(err)
    callback(null, all)
  })
}

// PRIVATE
function findInBatches (options, find, each, callback) {
  if (options) typeAssert(options, 'object', 'options')
  typeAssert(find, 'function', 'find')
  typeAssert(each, 'function', 'each')
  typeAssert(callback, 'function', 'callback')
  assert(find.length === 2, "The method 'find' must consist of two arguments: findMethod(options, callback)")
  assert(each.length === 2, "The method 'each' must consist of two arguments: each(data, callback)")

  var exited = 0
  function exit (err) { if (!exited++) callback(err) }

  var maximum = options.maximum || Infinity
  var offset = options.offset || 0
  var limit = options.batchSize || 50
  var page = 1
  var limitExceeded = false
  var processedDocuments = 0
  var queue = []
  var isProcessing = false
  var isFetching = false

  function fetch () {
    if (exited || isFetching) return
    if (limitExceeded) return exit(null)

    isFetching = true
    find({offset: offset, limit: limit, page: page}, function (err, docs) {
      isFetching = false
      if (err) return exit(err)

      if (!docs || docs.length < limit) limitExceeded = true
      page += 1
      offset += limit
      processedDocuments += docs.length
      if (processedDocuments >= maximum) {
        docs = docs.slice(0, docs.length - (processedDocuments - maximum))
        limitExceeded = true
      }

      append(queue, docs)
      process()
    })
  }

  function process () {
    if (isProcessing) return
    isProcessing = true

    // Prefetch documents in the background
    if (!limitExceeded) fetch()

    var docs = queue
    queue = []
    each(docs, function (err) {
      isProcessing = false
      if (err) return exit(err)
      if (queue.length === 0) fetch()
      else process()
    })
  }

  fetch()
}

function typeAssert (value, type, name) {
  assert(typeof value === type, 'The argument ' + name + ' must be a ' + type + ': findInBatches(findMethod, [options], each, callback)')
}

function append (arr, elems) {
  for (var i = 0, len = elems.length; i < len; i++) {
    arr[arr.length] = elems[i]
  }
}
