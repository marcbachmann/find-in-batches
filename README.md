# find-in-batches

A batch find method with that uses pagination and invokes a method for each element that was returned in the find method.

## API
### findInBatches(findMethod, options, forEach, callback)
```
options = {
    offset: 0,           // a default offset
    batchSize: 50,       // this gets passed to the findMethod as limit
    maximum: Infinity,   // maximum count of documents that get loaded
    concurrency: Infinity // how many forEach methods should run simultaneously
}

function findMethod(options, callback){
    // options = {offset, limit, page}

    // callback must be called with either an error
    //   or an array as second argument
    // e.g.
    request.get('http://localhost', function(err, body) {
        if (err) return callback(new Error('foo'))
        // body = [{id: 1, name: 'one'}, {id: 2, name: 'two'}, {id: 3, name: 'three'}]
        callback(null, body)
    })
}

function forEach(entry, callback) {
    // this function gets invoked for each element that
    // gets returned in the findMethod.
    // e.g. if the findMethod would return `callback(null, [{id: 1, name: 'one'}, {id: 2, name: 'two'}])`,
    // the entry would equal `{id: 1, name: 'one'}`
}

function callback(err) {
    // if forEach returns an error, it will show up here
}
```

## Example
```js
request = require('request')
findInBatches = require('find-in-batches')

function findMethod (options, callback) {
    // options = {offset: 0, limit: 50, page: 1} // on first search
    // options = {offset: 50, limit: 50, page: 2} // on second search

    var url = 'http://maps.gelbeseiten.de'
    url += '/yp/subscriberlist_ajaxAction.yp?urlSegmentSubjectString=starbucks'
    url += '&recfrom=' + options.offset + '&reccount=' + options.limit
    request.get({url: url, json: true}, function(err, response, body){
        if (err) return callback(err)
        if (!(body && body.data && body.data.subscribers)) return callback()
        callback(null, body.data.subscribers.subscribers)
    })
}

function forEach (entry, callback){
    entry.address = entry.address || {}
    entry.address.street = entry.address.street || {}
    console.log(
        "Name: %s, Address: %s, %s",
        entry.name,
        entry.address.street.name + ' ' + entry.address.street.houseno,
        entry.address.location
    )

    callback()
}

findInBatches(findMethod, {batchSize: 50}, forEach, function(err){
    console.log('Loaded all the entries')
})
```
