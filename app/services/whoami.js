// whoami - Resource information based on the connected user

var securityService = require('../security/securityService.js');

function apply(app, models, configuration) {
	securityService.apply(models);

	//Provides info for connected user
	app.get('/api/whoami', function(req, res) {
		var role = req.user.role;
		securityService.getAllPermissionsForRole(role, function(err, permissions) {
			if (err) {
				return res.status(500).json(err).end();
			}
			res.json(buildWhoAmiInfo(role, req, models, permissions))
			   .end();
		});
	});

	//Provides access info to a given resource for connected user
	app.get('/api/security/:resource', function(req, res) {
		var role = req.user.role;
		var resource = req.params.resource;
		securityService.getPermissionsFor(role, resource, function(err, permission) {
			if (err) {
				return res.status(500).json(err).end();
			}
			if (securityService.canAccessToResource(role, resource, permission)) {
				return res.json(buildDetailResourceInfo(role, resource, models, permission))
				          .end();
			} else {
				return res.status(403).json({message: 'Forbidden.'}).end();
			}
			
		});
	});
}

function buildWhoAmiInfo(role, req, models, permissions) {
	return {
		id: req.user._id,
		username: req.user.username,
		role: role,
		resources: buildResourceInfo(role, models, permissions)
	};
}

function buildResourceInfo(role, models, permissions) {
	var res = [];
	for(var key in models.models) {
		if (models.models.hasOwnProperty(key)) {
			var model = models.models[key];
			var resourceName = model.name;
			var permission = getPermissionForResource(permissions, resourceName);
			if (securityService.canAccessToResource(role, resourceName, permission)) {
				var item = {
					name: resourceName,
					path: '/api/' + model.plural,
					securityInfo: '/api/security/' + resourceName
				};
				res.push(item);			
			}
		}
	}
	return res;
}
function getPermissionForResource(permissions, resourceName) {
	for(var i=0; i<permissions.length; i++) {
		var perm = permissions[i];
		if (perm.resource.toLowerCase() === resourceName.toLowerCase()) {
			return perm;
		}
	}
	return null;
}
function buildDetailResourceInfo(role, resource, models, permission) {
	var model = findModelForResource(models, resource);
	if (!model) {
		return null;
	}
	var res = {
		role: role,
		name: model.name,
		path: '/api/' + model.plural,
		horizontalSecurity : securityService.getHorizontalPolicy(permission, 'none'),
		allowedOperations: buildAllowedOperations(permission)
	};
	
	return res;
}
function buildAllowedOperations(permission) {
	if (!permission) {
		return [];
	}
	var data = securityService.getAllowedOperations(permission);	
	return data;
}
function findModelForResource(models, resource) {
	for(var key in models.models) {
		
		if (models.models.hasOwnProperty(key)) {
			if (key.toLowerCase() === resource.toLowerCase()) {
				return models.models[key];				
			}
		}
	}
	return null;
}

module.exports = {
	apply : apply
};