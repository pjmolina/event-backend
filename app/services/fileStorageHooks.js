var fs = require('fs');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var jimp = require('jimp');
var tmp = require('tmp');
var metamodel = require('../metamodel'); 
var utils = require('./utilities');
var tmpPath = null;
var storage;
var uploadMidleware;

function apply(app, models, storageService, upload) {
	uploadMidleware = upload;
	storage = storageService;
	createTemporalDirectory();
	addBinaryGetService(app, storage);
	//Intercept resources containing properties with binary types to use the appropiate storage function store/retrieve	
	 Object.keys(models.models).forEach(function(key) { 
        var controller = models.models[key].controller;
		var binaryFields = resourceBinaryFields(key); 
		if (binaryFields.length > 0) {
			//1. Hook on requests
			var multerFields = buildMulterOptions(binaryFields);
			var multipartMw = uploadMidleware.fields(multerFields);
			controller.request('post put delete', multipartMw);

			controller.request('post put delete', function(req, res, next) {
				if (isMultiPart(req)) {
					preHook(key, binaryFields, req, res, next);	
				} else {
					next();							
				} 
			});
			//2. Hook on response
			controller.query('post put delete', function(req, res, next) {
				postHook(key, binaryFields, req, res, next);	
			});
		}		
	});
}

function buildMulterOptions(binaryFields) {
	var opts = [];
	opts.push(addMulterOption('data', 1));
	
	binaryFields.forEach(function(key) {
		opts.push(addMulterOption(key.name, key.name.indexOf('.') === -1 ? 1 : 100));
	});
	return opts;
}
function addMulterOption(name, maxCount) {
	var res = {
		name: camelize(name),
		maxCount : maxCount || 1
	};
	return res;
}

function createTemporalDirectory() {
	tmp.dir(function _tempDirCreated(err, path, cleanupCallback) {
		if (err) {
			throw err;
		}
		console.log("Temp directory: ", path);
		tmpPath = path;
	});
	tmp.setGracefulCleanup();	
}

function addBinaryGetService(app, storage) {
	app.get('/api/binary/:resource', function(req, res) {
		var resource = req.params.resource; 
		var targetFileName = tmpPath + '/' + resource;

	 	storage.downloadFile(resource, targetFileName, function(err, file, metadata) {
	 		if (err) {
	 			return handleError(err, res);
	 		}			
	 		if (isResizeNeeded(req)) {
	 			metadata = metadata || {}; 
				//resize image
				resizeImage(file, req, function(err, resizedFile) {
					if (err) {
						return handleError(err, res);
					}	
					metadata.originalFileName = null; //resizedFile;
					var format = sanitizeFormat(req.query.format);
					if (format) {
						//fix returned mime/type
						metadata.mimeType = utils.extensionToMime(format);					
					}
					serveFile(resizedFile, res, metadata);				
				});
			}
			else {
				//serve original
				serveFile(file, res, metadata);
			}
	 	});
	});
}

function isResizeNeeded(req) {
	return (req.query.w || req.query.h || req.query.bg || req.query.trx || req.query.format);
}

function resizeImage(file, req, cb) {
	var w = Number(req.query.w || 100);
	var h = Number(req.query.h || 100);
	var trx = req.query.trx || 'contain';
	var format = sanitizeFormat(req.query.format);

	var backgroundColor = null;
	if (req.query.bg) {
		backgroundColor = Number.parseInt(req.query.bg, 16) || null;	
	} 
	
	jimp.read(file, function (err, image) {
		if (err) {
			return cb(err, null);
		}
		var targetFile = getNameForThumbnail(file, w, h, format); 

		var i0; 
		if (backgroundColor) {
			i0 = image.background(backgroundColor);
		} 
		else {
			i0 = image;
		}

		var i1;
		if ('contain' === trx) {
			i1 = i0.contain(w, h);
		} 
		else if ('cover' === trx) {
			i1 = i0.cover(w, h);
		} 
		else if ('resize' === trx) {
			i1 = i0.resize(w, h);
		}
		else {
			i1 = i0.contain(w, h);
		}
		
		i1.quality(95)               					// Set JPEG quality 
		  .write(targetFile, function (err, saved) {    // Save 
			if (err) {
				return cb(err, null);
			}
			return cb(null, targetFile);
		}); 	 
	});
}

function sanitizeFormat(format) {
	if (format === 'png') {
		return format;
	}	
	if (format === 'jpg') {
		return format;
	}	
	return null;
}

function getNameForThumbnail(filename, w, h, format) {
	var index = filename.lastIndexOf('.');
	var base = filename.substr(0, index);
	var extension = filename.substr(index+1);
	var ext = (format === null) ? extension : format;
	var name = base + '-'+ w + 'x' + h + '.' + ext;
	return name;
}

function handleError(err, res) {
	res.status(500).json(err).end();
}
function serveFile(file, res, metadata) {
	if (file) {	
		var mimeType = ((metadata !== null) ? metadata.mimeType : null) || 'application/octet-stream'; 
		var filename = (metadata !== null) ? metadata.originalFileName : file.filename;
		res.status(200).set('Content-Type', mimeType);

		if (filename && 
		    mimeType!=='image/jpeg' && 
			mimeType!=='image/png') {
		   res.attachment(filename);			
		}		
		res.sendFile(file);
	}
	else {
		res.status(404)
		   .set('Content-Type', 'application/json')
		   .json({})
		   .end();		
	}
}

function preHook(resourceName, binaryFields, req, res, next) {
	extractPayLoad(req, function(err, payload) {
		if (err) {			
			res.status(422)
			   .json(err)
			   .end();
			return console.error(err);
		}
		if (req.method==='POST') {
			return preHookPost(req, res, next, resourceName, payload);
		}
		else if (req.method==='PUT') {
			return preHookPut(req, res, next, resourceName, binaryFields, payload);
		}
		else {
			return next();
		}
	});
}

function getOwnerId(req) {
	if (req && req.user && req.user._id) {
		return req.user._id.toString();
	}
	return null; //Not found
}
var ownerIdFieldName = '_ownerId';

function preHookPost(req, res, next, resourceName, payload) {
	persistOnStorage(req, resourceName, payload, function(err, message) {
		payload[ownerIdFieldName] = getOwnerId(req);
		if (err) {
			return res.status(422).json(err).end();
		}
		req.body = message;
		return next();
	});
}
function preHookPut(req, res, next, resourceName, binaryFields, payload) {
	//retrieve previous resource.
	var id = req.params.id;
	req.baucis.controller.model().findOne({_id: id}).exec(function (err, resource) {
		if (err) {
			return res.status(422).json(err).end();
		}
		if (!resource) {
			return res.status(404).end();
		}
		//for each new attached file: delete the previous stored one
		deleteOldFilesToOverride(req, resource);
		persistOnStorage(req, resourceName, payload, function(err, message) {
			if (err) {
				return res.status(422).json(err).end();
			}
			req.body = message;
			deleteFilePropertiesSetToNull(message, resource, binaryFields, function (err) {
				if (err) {
					return res.status(422).json(err).end();
				}
				return next();
			});
		});
	});
}

function deleteFilePropertiesSetToNull(newObject, oldObject, binaryFields, cb) {
	try {
		for (var i = 0; i < binaryFields.length; i++) {
			var item = binaryFields[i];
			var key = camelize(item.name);
			var index = key.indexOf('.');
			if (index === -1) {
				var newValue = newObject[key];
				var oldValue = oldObject[key];
				if (oldValue && newValue === null) {
					deleteStoredFile(oldValue);
				}
			}
			else {
				var prop1 = key.substring(0, index);
				var prop2 = camelize(key.substring(index + 1, key.length));
				if (oldObject[prop1] instanceof Array) {
					/* jshint -W083 */
					oldObject[prop1].forEach(function (oldElement) {
						if (oldElement[prop2]) {
							var found = false;
							newObject[prop1].forEach(function (newElement) {
								if (newElement._id && newElement._id.toString() === oldElement._id.toString()) {
									if (newElement[prop2] === null || newElement[prop2] !== oldElement[prop2]) {
										deleteStoredFile(oldElement[prop2]);
									}
									found = true;
									return;
								}
							});
							if (!found) {
								deleteStoredFile(oldElement[prop2]);
							}
						}
					});
					/* jshint +W083 */
				}
			}
		}
		cb(null);
	}
	catch (err) {
		return cb(err);
	}
}

function deleteStoredFile(key) {
	var targetKey = removePrefix(key);
	storage.deleteFile(targetKey, function(err, data) {
		if (err) {
			console.error(err);
		}
	});		
}

function postHook(resourceName, binaryFields, req, res, next) {
	deleteFiles(req.files);
	if (req.method==='DELETE') {
		return postHookDelete(req, res, next, binaryFields);
	}
	next();
}

function postHookDelete(req, res, next, binaryFields) {
	req.baucis.outgoing(function (context, cb) {
		//retrieve previous resource.
		var obj = context.doc;
		deleteAllFilesForResource(obj, binaryFields);		
	    cb(null, context);
	});
	next();
}

function deleteAllFilesForResource(obj, binaryFields) {
	Object.keys(binaryFields).forEach(function (key) {
		var binField = binaryFields[key];
		var fileKeys = getResourceValues(obj, camelize(binField.name));
		fileKeys.forEach(function (fileKey) {
			if (fileKey) {
				deleteStoredFile(fileKey);
			}
		});
	});
}

function camelize(s) {
	if (!s) {
		return s;
	}
	if (s.length === 1) {
		return s.toLowerCase();
	}
	return s[0].toLowerCase() + s.substring(1);
}

function deleteOldFilesToOverride(req, resource) {
	Object.keys(req.files).forEach(function(key) {
		if (key.indexOf('.') === -1) {
			var propValue = resource[key];
			if (propValue) {
				var targetKey = removePrefix(propValue);
				storage.deleteFile(targetKey, function (err, data) {
					if (err) {
						console.error(err);
					}
				});
			}
		} 
	});
}

function removePrefix(uri) {
	if(!uri) {
		return null;
	}
	return uri.replace('/api/binary/', '');
}

function deleteFiles(files) {
	if (!files) {
		return;
	}
	Object.keys(files).forEach(function(key) {
		var array = files[key];
		for (var i = 0; i < array.length; i++) {
			var file = array[i];
			if (file) {
				fs.unlink(file.path, handleDeleteError);					
			}				
		}
	});
}
function handleDeleteError(err) {
	if (err) {
		console.error(err);		
	}
}

function extractPayLoad(req, cb) {
	if (req.files && req.files.data && req.files.data.length === 1 ) {
		fs.readFile(req.files.data[0].path , function (err, payload) {
			if (err) {
				return cb(err, null);
			}
			var data = JSON.parse(payload);
			return cb(null, data);
		});
	}
	else if (req.files && req.body.data) {
		var data1 = JSON.parse(req.body.data);
		return cb(null, data1);
	}
	else {
		cb('No payload found', null);
	}
}

function isMultiPart(req) {
	return (req.headers['content-type'] || '').indexOf('multipart/form-data', 0) === 0;	
}

function resourceBinaryFields(resourceName) {
	return metamodel.getBinaryPropertiesForClass(resourceName);
}

function persistOnStorage(req, resourceName, payload, cb) {
	var uploads = [];
	//1. For each new upload -> store and update the message
	Object.keys(req.files).forEach(function(key) {
		if (key !== 'data') {
			var array = req.files[key];
			array.forEach(function(file) {
				if (file) {
					var targetName = getUniqueName(file.originalname);
					var mimeType = file.mimetype;
					var path = file.path;
					var originalName = file.originalname;
					var fn = function(callback) {
						storage.uploadFile(path, targetName, mimeType, originalName, function(err, data) {
							if (err) {
								console.error(err);
							}
							payload = setResourceValue(payload, key + (key.indexOf('.') === -1 ? '' : ('.' + array.indexOf(file))), storage.getFileResourceName(targetName));
							callback(err, data);
						});
					};
					uploads.push(fn);
				}
			});
		}
	});
	
	async.parallel(uploads, function(err, result) {
		return cb(err, payload);
	});
}

function setResourceValue(resource, key, path) {
	var index = key.indexOf('.');
	if (index > 0) {
		var prop1 = key.substring(0, index);
		var prop2 = key.substring(index + 1, key.indexOf('.', index + 1));
		if (prop1 && prop2 && resource[prop1] instanceof Array) {
			for (var i = 0; i < resource[prop1].length; i++) {
				if(resource[prop1][i][prop2] === 'cid:' + key) {
					resource[prop1][i][prop2] = path;
				}
			}	
		}
	}
	else {
		resource[key] = path;
	}
	return resource;
}

function getResourceValues(resource, key) {
	var results = [];
	var index = key.indexOf('.');
	if (index > 0) {
		var prop1 = key.substring(0, index);
		var prop2 = key.substring(index + 1, key.length);
		if (resource[prop1] instanceof Array) {
			resource[prop1].forEach(function (element) {
				results.push(element[camelize(prop2)]);
			});
		}
	}
	else {
		results.push(resource[key]);
	}

	return results;
}

//Provides a unique new name for a file in the storage 	
function getUniqueName(filePath) {
	var ext = path.extname(filePath);
	return randomValueBase64(10) + ext;
}

function randomValueBase64 (len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '1')  // replace '/' with '1'
        .replace(/\=/g, '2'); // replace '=' with '2'
}


module.exports = {
	apply : apply
}; 