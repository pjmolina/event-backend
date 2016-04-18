/*eslint no-irregular-whitespace: 2*/
// Utilities common helper functions

function success(res) {
	send(res, { 'success': 'ok' });
}
function error(res, err) {
	if (err.type === 'NotFound') {
		return notFound(res, err.resource, err.id);
	}
	else {
		if (err.code === 11000) {
			//MongoDB duplicate key - invalid operation
			send(res, { 'error': err }, 412);
		}
		else {
			send(res, { 'error': err }, 500);
		}
	}
}
function notFound(res, schema, id) {
	send(res, { 'error': 'Not Found', 'schema': schema, 'id': id }, 404);
}
function send(res, msg, statusCode) {
	statusCode = statusCode || 200;
	res.status(statusCode)
		.json(msg)
		.end();
}
function logError(err) {
	console.error(err);
}
function notFoundException(resourceName, id) {
	return {
		type: 'NotFound',
		resource: resourceName,
		id: id
	};
}
function format(template, params) {
	var msg = template;
	for (var key in params) {
		if (params.hasOwnProperty(key)) {
			msg = msg.replace(new RegExp('{' + key + '}', 'g'), params[key]);
		}
	}
    return msg;
}
function startsWith(str, preffix){
	if (str === null || preffix === null) {
		return false;
	}
	var res = str.substr(0, preffix.length) == preffix;
	return res;
}
function endsWith(str, suffix) {
	if (str === null || suffix === null) {
		return false;
	}
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
//redefine for speed
var hasOwnProperty2 = Object.prototype.hasOwnProperty;
function isEmptyObject(obj) {
	// null and undefined are "empty"
	if (obj === null) {
		return true;
	}
	// Assume if it has a length property with a non-zero value
	// that that property is correct.
	if (obj.length > 0) {
		return false;
	}    
	if (obj.length === 0) {
		return true; 
	}  
	// Otherwise, does it have any properties of its own?
	// Note that this doesn't handle
	// toString and valueOf enumeration bugs in IE < 9
	for (var key in obj) {
		if (hasOwnProperty2.call(obj, key)) {
			return false;  
		} 
	}
	return true;
}
function toPascal(input) {
	if (input === null) {
		return null;
	}
	var s = input.toString().replace(/(\w)(\w*)/g, function(g0,g1,g2) { 
		return g1.toUpperCase() + ( isAllCaps(g2) ? g2.toLowerCase() : g2 );
	});
	return s;
}
function isAllCaps(text) {
	return ! /[a-z]/g.test(text);
}
function toCamel(input) {
	if (input === null) {
		return null;
	}
	var s = input.toString().replace(/(\w)(\w*)/g, function(g0,g1,g2) { 
		return g1.toLowerCase() + g2;
	});
	return s;
}
function clone(obj) {
	if (null == obj || "object" != typeof obj) {
		return obj;
	}
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) {
			copy[attr] = obj[attr];
		}
	}
	return copy;
}
var mimeTypes = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'application/pdf': 'pdf',
	'application/x-pdf': 'pdf'
};
var extensions = {
	'png': 'image/png',
	'jpg': 'image/jpeg',
	'jpeg': 'image/jpeg',
	'gif': 'image/gif',
	'pdf': 'application/pdf'
};
function mimeToExtension(mime) {
	if (mime === null) {
		return null;
	}
	var ext = mimeTypes[mime];
	return ext || null; 
}
function extensionToMime(extension) {
	if (extension === null) {
		return '';
	}
	var mime = extensions[extension];
	return mime || 'applicaton/octec-stream';   
}

module.exports = {
	success: success,
	error: error,
	notFound: notFound,
	send: send,
	logError: logError,
	notFoundException: notFoundException,
	format: format,
	startsWith : startsWith,
	endsWith: endsWith,
	isEmptyObject : isEmptyObject,
	toPascal: toPascal,
	toCamel: toCamel,
	isAllCaps : isAllCaps,
	clone: clone,
	mimeToExtension : mimeToExtension,
	extensionToMime : extensionToMime 
};