request = require('request')
findInBatches = require('../')


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
