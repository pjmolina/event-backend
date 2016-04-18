//General API ----
var metamodel = require('../metamodel');

function apply(app, models, configuration) {

	//General error handler -- log error
	app.use(function(err, req, res, next) {
		console.error(req.query);
		console.error(err.stack);
	});

	//config-----
	app.post('/api/setConfigKey', function(req, res){
		console.log("SetKey:");
	 	try {
			var item = {
			      'key': req.body.key,
			      'value': req.body.value
			    };
			var Model = models.models._config.model;

			console.log("SetKey: " + item.key + '=' + item.value);

			//delete all entries with the same key.
			Model.remove({ 'key': item.key }, function (err, doc) {
				if (err) {
					console.err(err);
				}				
			});

			//create setting
			var newDoc = new Model({
			  'key': item.key,
			  'value': item.value
			});
			newDoc.save();

			res.status(200)
			   .set('Content-Type', 'text/json')
			   .send('{}');

		}
		catch (e) {
			res.status(501)
			   .set('Content-Type', 'text/json')
			   .send('{ "error" : "' + e.message + '"}');
		}
	});

	//Get webhooks
	app.get('/api/webhook', function (req, res) {
		try {
		    var WhModel = models.models._webhooks.model;
			WhModel.find({}, function(err, webhooks) {
				if (err) {
					return res.status(412).json({ error: err });
				}
				return res.status(200).json(webhooks);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});
	//Save webkhooks ---	
	app.post('/api/webhook', function(req, res){
		try {
		    var hook = req.body;
		    var WhModel = models.models._webhooks.model;

			var newDoc = new WhModel({
				enabled: hook.enabled,
				resource : hook.resource,
				operation : hook.operation,
				httpMethod : hook.httpMethod,
				urlTemplate : hook.urlTemplate,        
				parameters : buildParams(hook.parameters),
				contentType: hook.contentType,
				bodyTemplate: hook.bodyTemplate
			});
			newDoc.save(function(err, savedHook) {
				if (err) {
					return res.status(501).json({ error: err });
				}
				return res.status(200).json(savedHook);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});	
	
	app.put('/api/webhook/:id', function(req, res){
		try {
			var id = req.params.id;
		    var hook = req.body;
		    var WhModel = models.models._webhooks.model;
			
			WhModel.findOne({_id: id}, function(err, object) {
				if (err) {
					return res.status(404).json({ error: 'Not found' });
				}
				object.enabled = hook.enabled; 
				object.resource = hook.resource; 
				object.operation = hook.operation; 
				object.httpMethod = hook.httpMethod; 
				object.urlTemplate = hook.urlTemplate; 
				object.parameters = buildParams(hook.parameters); 
				object.contentType = hook.contentType; 
				object.bodyTemplate = hook.bodyTemplate; 
				
				object.save(function(err, updated) {
					if (err) {
						return res.status(412).json({ error: err });
					}
					return res.status(200).json(updated);					
				});
			});
	 	}
	  	catch (e) {
			return res.status(412).json({error: e});
	  	}
	});	
	
	app.delete('/api/webhook/:id', function(req, res){
		try {
			var id = req.params.id;
		    var WhModel = models.models._webhooks.model;
	
			WhModel.findByIdAndRemove({_id: id}, function(err, removed) {
				if (err) {
					return res.status(501).json({ error: err });
				}
				if (!removed) {
					return res.status(404).json({});
				}
				return res.status(200).json(removed);
			});
	 	}
	  	catch (e) {
			return res.status(412).json({error: e});
	  	}
	});	
	
	app.post('/api/saveHooks', function(req, res){
		try {
		    var hooks = req.body.items;
		    var WhModel = models.models._webhooks.model;
		    console.log("Save hooks: " + hooks.length + " received.");

		    //delete all previous entries
		    WhModel.remove({ }, function (err, doc) {
				if (err) {
					console.err(err);
				}
		    });

			//persist all hooks
			for(var i in hooks) {
				var item = hooks[i];

				console.log(JSON.stringify(item));

				var newDoc = new WhModel({
					enabled: item.enabled,
					resource : item.resource,
					operation : item.operation,
					httpMethod : item.httpMethod,
					urlTemplate : item.urlTemplate,        
					parameters : buildParams(item.parameters),
					contentType: item.contentType,
					bodyTemplate: item.bodyTemplate
				});
				newDoc.save();
			}

			res.status(200)
			   .set('Content-Type', 'text/json')
			   .send('{}');
	 	}
	  	catch (e) {
	    	res.status(412)
	       		.set('Content-Type', 'text/json')
	       		.send('{ "error" : ' + e + '}');
	  	}
	});

	function buildParams(params) {
		var result = [];
		if (params !== null) {
			params.forEach(function(item) {
				result.push({
					type: item.type,
					key: item.key,
					value: item.value
				});
			});
		}
		return result;
	}

	//Ping service for heartbeat (public) - to check if service is alive
	app.get('/ping', function(req, res) {
		res.status(200)
		   .set('Cache-Control', 'no-cache')
		   .send({ msg: 'pong' })
		   .end();
	});

	//Health Status service: rewrite to verify the health of your microservice
	app.get('/api/status', function(req, res) {
		serviceStatus(function status(err, statusInfo) {
			return res.status(err ? 500 : 200)
				      .set('Cache-Control', 'no-cache')
				      .send(statusInfo)
				      .end();	
		});
	});

	//Rewrite to verify the health of your microservice
	function serviceStatus(callback) {
		if (configuration.error) {
			//fatal error
			return callback(true, {
				status: 'malfunction',
				error: '' + configuration.error,
				version: versionInfo()
			});
		}
		//check mongoDB is available with a simple query
		var configModel = models.models._config.model;
		configModel.findOne({}, function(err, data) {
			if (err) {
				return callback(true, {
					status: 'malfunction',
					error: err,
					version: versionInfo()
				});
			}
			return callback(false, {
					status: 'operational',
					version: versionInfo()
				});
		});
	}

	function versionInfo() {
		return {
			generatorEngine: configuration.versions.generatorEngine,
			generatorVersion: configuration.versions.generatorVersion,
			generatedAt: configuration.versions.generatedAt,
			formula: configuration.versions.formulaName,
			formulaVersion: configuration.versions.formulaVersion
		};
	}

	//Security roles and permissions API
	app.get('/api/admin/permissions', function(req, res) {
		try {
		    var PermissionsModel = models.models._permissions.model;
			PermissionsModel.find({}, function(err, permissions) {
				if (err) {
					return res.status(412).json({ error: err });
				}
				return res.status(200).json(permissions);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});
	app.get('/api/admin/permissions/:role', function(req, res) {
		try {
		    var PermissionsModel = models.models._permissions.model;
			PermissionsModel.find({ 
				role: req.params.role 
			}, function(err, permissions) {
				if (err) {
					return res.status(412).json({ error: err });
				}
				return res.status(200).json(permissions);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});
	app.get('/api/admin/permissions/:role/:resource', function(req, res) {
		try {
		    var PermissionsModel = models.models._permissions.model;
			PermissionsModel.findOne({
				role: req.params.role,
				resource: req.params.resource
			}, function(err, permissions) {
				if (err) {
					return res.status(412).json({ error: err });
				}
				return res.status(200).json(permissions);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});

	app.delete('/api/admin/permissions/:role', function(req, res) {
		try {
		    var PermissionsModel = models.models._permissions.model;
			PermissionsModel.remove({ 
					role: req.params.role
			}, function(err, deletedPermissions) {
				if (err) {
					return res.status(412).json({ error: err });
				}
				return res.status(200).json(deletedPermissions);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});
	app.post('/api/admin/permissions', function(req, res) {
		try {
		    var PermissionsModel = models.models._permissions.model;
			//delete old ones
			PermissionsModel.remove({
				role: req.body.role,
				resource: req.body.resource
			}, function(err, deleted) {
				if (err) {
					console.log(err);
					return res.status(501).json({ error: err });
				}
				var item = new PermissionsModel(req.body);
				item.save(function(err, savedPermissions) {
					if (err) {
						return res.status(412).json({ error: err });
					}
					return res.status(200).json(savedPermissions);
				});
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});
	
	app.post('/api/admin/permissions-import', function(req, res) {
		try {
		    var PermissionsModel = models.models._permissions.model;
			//delete all
			PermissionsModel.remove({
			}, function(err, deleted) {
				if (err) {
					console.log(err);
					return res.status(501).json({ error: err });
				}
				for(var i=0; i<req.body.length; i++) {
					var item = req.body[i];
					var per = new PermissionsModel(item);
					per.save(savePermCallback);
				}
				return res.status(200).json({done: 'true'});
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});

	function savePermCallback(err, sper) {
		if (err) {
			console.error('Import security error: ' + err);
		}
		else {
			console.log('Imported security rule for: ' + sper.role + ':' + sper.resource);
		}
	}

	//Metadata query API
	app.get('/api/metadata', function(req, res) {
		return res.status(200)
				  .json({
						modelType: 'hivepod-model',
						version: '1.0',
						metamodel: metamodel
					})
				  .end();	
	});
}

module.exports = {
	apply : apply
};