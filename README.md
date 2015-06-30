# find-in-batches

A batch find method that uses pagination and invokes a method for each element that was returned in the find method.

## API

### findInBatches(findMethod, options, forEach, callback)
```js
var request = require('request')
var findInBatches = require('find-in-batches')

var options = {
    offset: 0,            // a default offset
    batchSize: 50,        // this gets passed to the findMethod as limit
    maximum: Infinity,    // maximum count of documents that get loaded
    concurrency: Infinity // how many forEach methods should run simultaneously
}

findInBatches(findMethod, options, forEach, function(err){
    if (err) return console.error('Failed to load the entries', err)
    console.log('Loaded all the entries')
});

function findMethod (options, callback) {
    // options = {offset: 0, limit: 50, page: 1} // on first search
    // options = {offset: 50, limit: 50, page: 2} // on second iteration
    var url = 'http://maps.gelbeseiten.de'
    url += '/yp/subscriberlist_ajaxAction.yp?urlSegmentSubjectString=starbucks'
    url += '&recfrom=' + options.offset + '&reccount=' + options.limit
    request.get({url: url, json: true}, function(err, response, body){
        // the callback must be called with either an error
        // or an array as second argument
        if (err) return callback(err)
        if (!(body && body.data && body.data.subscribers)) return callback()
        callback(null, body.data.subscribers.subscribers)
    })
}

// forEach gets invoked for each element that gets returned in the findMethod.
// e.g. if the findMethod would return `callback(null, [{id: 1, name: 'one'}, {id: 2, name: 'two'}])`,
// the entry would equal `{id: 1, name: 'one'}`
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
```
