// __Dependencies__
var es = require('event-stream');

// __Module Definition__
/*eslint no-unused-vars: [0]*/
var plugin = module.exports = function () {
    var baucis = this;

    // __Private Methods__
    function getCsvHeaders(obj) {
        var res = [], prop;
        for (prop in obj) {
			if (prop == "__v") {
				continue; //ignore versioning
			}
            if (obj.hasOwnProperty(prop)) {
                res.unshift(prop);
            }
        }
        return res;
    }
  
    function isObjectId(obj) {
        return (typeof obj === 'object' && obj._bsontype === 'ObjectID');
    }
    function csvEncode(data) {
        var text;
        if (data == null) {
            return '';
        }
        if (isObjectId(data)) {
            return data.toString();
        }
        text = data.toString();
        
        if ((text.indexOf(',') >= 0) || (text.indexOf('.') >= 0) || (text.indexOf(' ') >= 0)) {
            return '"' + text + '"';
        }   
        return text;
    }
    function csvEncodeObject(obj, props) {
        var res = '', prefix ='', prop;
        for (prop in props) {
            res += prefix + csvEncode(obj[props[prop]]);
            prefix= ',';
        }
        return res + '\r\n';
    }
    function csvHeaderToString(headers) {
        //build csv headers---
        var prefix='', text = '', i;
        for (i in headers) {
            text += prefix + csvEncode(headers[i]);
            prefix=',';
        }
        return 'sep=,\r\n' + text + '\r\n';
    }

    // Default formatter - emit a single CSV object or an array of them.
    function csvFormatter (alwaysArray) {
        var first = false;
        var multiple = false;
        var csvHeaders = [];
        
        //lack: missing info here to gather the model meta-data when there is no real data and emit csvHeaders
        //this.emit('data', csvHeaderToString(csvHeaders));
        
        return es.through(function write(doc) {
            // First document
            if (!first) {
                first = doc;
                csvHeaders = getCsvHeaders(doc._doc);
                this.emit('data', csvHeaderToString(csvHeaders));
                this.emit('data', csvEncodeObject(first._doc, csvHeaders));
                return;
            }
            // Second document
            if (!multiple) {
                multiple = true;
            }
            //emit second and rest of them
            this.emit('data', csvEncodeObject(doc._doc, csvHeaders));
        },
        function end() {
            // Done.  End the stream.
            this.emit('end');
        });
    }
    // Add as CSV formatter.
    baucis.setFormatter('text/csv', csvFormatter);
};