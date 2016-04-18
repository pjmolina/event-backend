var mongoose = require('mongoose');
var grid = require('gridfs-stream');
var fs = require('fs');

var cnx, gfs;
var BinaryContentModel;

function apply(mongooseCnx) {
	cnx = mongooseCnx.connections[0];
	gfs = grid(cnx.db, mongoose.mongo);

	var binaryContentSchema = new mongoose.Schema({ 
		key: 	 	   		{ type: String, required: true },
		originalFileName:   { type: String, required: false },
	  	mimeType: 	   		{ type: String, required: false },
	  	size:    	   		{ type: Number, required: false },
	  	lastModified:  		{ type: Date,   required: true, default: Date.now },
		description:   		{ type: String, required: false }
	})
	.index({ key: 1 }, { unique: true });

	BinaryContentModel = mongoose.model('binaryContent', binaryContentSchema);
	return BinaryContentModel;
}

//See: https://github.com/aheckmann/gridfs-stream

function uploadFile(sourceFilePath, remoteFileName, mimeType, originalName, cb) {
	var options = {
    	filename: remoteFileName,
    	mode: 'w', 
    	chunkSize: 1024,
    	content_type: mimeType || 'application/octet-stream', // For content_type to work properly, set "mode"-option to "w" too!
	    metadata: {
	    	lastModified: Date.now()
   		}
	};
	var writestream = gfs.createWriteStream(remoteFileName, options);
	var r = fs.createReadStream(sourceFilePath).pipe(writestream);
	r.on('error', function (err) {
		cb(err, null);
	});
	r.on('close', function (file) {
		var newFile = new BinaryContentModel({
			key : remoteFileName,
			originalFileName : originalName,
			mimeType : mimeType,
			size : file.length,
			lastModified : Date.now(),
			description : null
		});
		newFile.save(function(err, newFile) {
			if (err) {
				return cb(err, null);
			}
			cb(null, file);			
		});
	});
}

function downloadFile(remoteFileName, localFileName, cb) {
	try {
		var options = {
			filename: remoteFileName
		};
		var readstream = gfs.createReadStream(options);
		var writeStream = fs.createWriteStream(localFileName);
		writeStream.on('error', function (err) {
			cb(err, null);
		});
		readstream.on('error', function (err) {
			cb(err, null);
		});
		readstream.on('close', function (file) {
			BinaryContentModel.findOne({key: remoteFileName}, function(err, fileMetadata) {
				if (err) {
					return cb(err, null);
				}			
				cb(null, localFileName, fileMetadata);
			});
		});
		readstream.pipe(writeStream);
	}
	catch(err) {
		cb(err, null);		
	}
}

function deleteFile(remoteFileName, cb) {
	var options = {
		filename: remoteFileName
	};
	gfs.remove(options, function (err) {
		BinaryContentModel.remove({key: remoteFileName}, function(err1, removed) {
			if (err1) {
				return cb(err1, null); //error			
			}
			if (err) {
				return cb(err, null); //error			
			}
			return cb(null, options); //done
		});
	});
}
function getFileResourceName(targetName) {
	return '/api/binary/' + targetName;
}

module.exports = {
	apply: apply,
	uploadFile: uploadFile,
	downloadFile: downloadFile,
	deleteFile: deleteFile,
	getFileResourceName: getFileResourceName
};
