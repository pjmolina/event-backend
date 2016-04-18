var pkgcloud = require('pkgcloud');
var fs = require('fs');

var client, conf;

function apply(configuration) {
	conf = configuration;

	client = pkgcloud.storage.createClient({
		provider: conf.provider,
		keyId: conf.accessKeyId,
		key: conf.accessKeySecret,
		region: conf.region
	});

	return client;
}

function getContainer(containerName, callback) {
	client.getContainer(containerName, function (err, container) {
		return callback(err, container);
	});
}

//See: https://github.com/pkgcloud/pkgcloud#storage

function uploadFile(sourceFilePath, remoteFileName, mimeType, cb) {
	var readStream = fs.createReadStream(sourceFilePath);
	var writeStream = client.upload({
		container: conf.container,
		remote: remoteFileName,
		mimeType: mimeType
	});

	writeStream.on('error', function(err) {
		cb(err, null);
	});

	writeStream.on('success', function(file) {
		cb(null, file);
	});
	return readStream.pipe(writeStream);
}

function downloadFile(remoteFileName, localFileName, cb) {
	try {	
		var read = client.download({
			container: conf.container,
			remote: remoteFileName
		});
		var writer = fs.createWriteStream(localFileName); 	
		
		writer.on('error', function(err) {
			cb(err, null);
		});
		writer.on('finish', function(file) {
			cb(null, localFileName);
		});
		read.on('error', function(err) {
			cb(err, null);
		});
		
		read.pipe(writer);
	}
	catch (err) {
		cb(err, null);
	}
}

function deleteFile(fileName, cb) {
	client.removeFile(conf.container, fileName, function (err) { 
		return cb(err, fileName);
	});
}

function getFileResourceName(targetName) {
	return '/api/binary/' + targetName;
}

module.exports = {
	apply: apply,
	getContainer : getContainer,
	uploadFile: uploadFile,
	downloadFile: downloadFile,
	deleteFile: deleteFile,
	getFileResourceName: getFileResourceName
};
