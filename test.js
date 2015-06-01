var test = require('tape')
var tapSpec = require('tap-spec')
test.createStream().pipe(tapSpec()).pipe(process.stdout)

var findInBatches = require('./')

var data = []
for (var i = 1; i < 1000; i++) {
  data.push(i)
};


test('Test the iteration', function(t) {
  t.plan(2)

  var findCalls = 0
  findMethod = function (options, callback) {
    findCalls += 1

    end = options.offset + options.limit
    partial = data.slice(options.offset, end)
    callback(null, partial)
  }

  var eachCalls = 0
  var batchSize = 100
  findInBatches(findMethod, {batchSize: batchSize}, function (data, callback) {
    eachCalls += 1
    callback()
  }, function (err) {
    t.equal(findCalls, 10, 'The find callback gets called until it returns no more documents')
    t.equal(eachCalls, data.length, 'The each callback gets called for each item')
  })
})


test('Test whether errors get catched', function(t) {
  t.plan(3)

  var eachCalls = 0
  findInBatches(function (options, callback) {
    partial = data.slice(options.offset, options.offset + options.limit)
    callback(null, partial)
  }, {batchSize: 100}, function (data, callback) {
    var err = undefined;
    if (data === 55) err = new Error('Some error')
    eachCalls += 1
    callback(err)
  }, function (err) {
    t.equal(eachCalls, 55)
    t.equal(err.message, 'Some error', "The error gets passed to the 'end' method.")
    setTimeout(function () {
      // The 'each' method gets called in parallel.
      // So it completes the current batch and stops after that.
      t.equal(eachCalls, 55, 'The iteration gets canceled.')
    }, 200)
  })
})


test('Test the arguments that get passed to the find method', function(t) {
  t.plan(5)

  var testLimit = 2
  var testOffset = 0
  var iteration = 0
  var noop = function (data, callback) { callback() }
  findInBatches(function (options, callback) {
    t.equal(options.offset, iteration * testLimit)
    t.equal(options.limit, testLimit)
    iteration += 1
    if (iteration == 2) return callback(new Error('foo'))
    callback(null, [1, 2])

  }, {batchSize: testLimit}, noop, function (err) {
    t.equal(err.message, 'foo')
  })
})
