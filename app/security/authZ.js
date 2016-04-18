var es = require('event-stream');
var utils = require('../services/utilities');
var securityService = require('./securityService.js');

var m;
var idFieldName = '_id';
var ownerIdFieldName = '_ownerId';
var operationMiddlewares = []; 

var hashedPathsToResourceNames = {};

var HorizontalSecurityPolicies = {
	public : 'public',
	private : 'private',
	shared : 'shared',
	none : 'none'
};


function apply(app, models, configuration) {
	m = models;
	securityService.apply(models);	
	hookAuthZMiddleware(app, models); 
	hashPaths(m);
	return this;
}

function hashPaths(m) {
	Object.keys(m.models).forEach(function(resourceKey) { 
		var model = m.models[resourceKey].model;
		var path = model.plural();
		
		hashedPathsToResourceNames[path] = resourceKey;
	});
}

function hookAuthZMiddleware(app, models) {

	//express filter
	app.use('/api', authorizeResourceOperationMiddleware);

	//Hook on each controller
	Object.keys(models.models).forEach(function(resourceKey) { 
		var resource = models.models[resourceKey];
		var ctl = resource.controller;

		if (ctl) {
			//authN - moved to express level

			//insert ownership (when needed on POST / creation - baucis)
			if (resourceNeedsOwnership(resource)) {
				ctl.request('post', function (req, res, next) {
					setOwnership(req);
					next();
				});		
			}
			//horizontal security on baucis	query
			ctl.query(function (req, res, next) {
				setHorizontalSecurity(req, res, next);			
			});
			
			//filter properties on returned resources on baucis query
			ctl.query(function (req, res, next) {
				filterAttributes(req, res, next);
			});
			
			//hook middleware to set HATEOAS: include -> HAL links
			ctl.request(function (req, res, next) {
				req.baucis.outgoing(es.through(function (context) {
					buildHalLinks(context, req);
					this.queue(context);
				}));
				next();
			});
		}
		else {
			console.error('Controller not found for resource: ' + resourceKey);
		}

	});
}

function buildHalLinks(context, req) {
	var userId = getOwnerId(req);
	//var protocol = req.protocol;
	//var hostname = req.hostname;
	var operation = req.authz.operation;
	var permissions = req.authz.permissions;
	 
	if (!context || !context.doc) {
		return;
	}
	addHalLink(context, 'self', '/api/' + operation.resourcePath + '/' + context.doc._id, 'GET');
	
	if (canEditObject(userId, permissions, operation, context.doc)) {
		addHalLink(context, 'action-edit', '/api/' + operation.resourcePath + '/' + context.doc._id, 'PUT');		
	}		
	if (canDeleteObject(userId, permissions, operation, context.doc)) {
		addHalLink(context, 'action-delete', '/api/' + operation.resourcePath + '/' + context.doc._id, 'DELETE');
	}		
}

function canEditObject(userId, permissions, operation, obj) {
	if (operation.verb === 'DELETE') {
		return false; //Cannot delete twice
	}
	if (!permissions) {
		return false;
	}
	if (permissions.horizontalSecurity.type === HorizontalSecurityPolicies.none) {
		return false; //not accesible
	}
	if (permissions.horizontalSecurity.type === HorizontalSecurityPolicies.private ||
	    permissions.horizontalSecurity.type === HorizontalSecurityPolicies.shared) {
		if (obj[ownerIdFieldName] !== userId ) {
			return false; //not owned
		}
	}
	var res = securityService.canExecuteOperation(permissions, { verb:'PUT' });
	return res;
}
function canDeleteObject(userId, permissions, operation, obj) {
	if (operation.verb === 'DELETE') {
		return false; //Cannot delete twice
	}
	if (!permissions) {
		return false;
	}
	if (permissions.horizontalSecurity.type === HorizontalSecurityPolicies.none) {
		return false; //not accesible
	}
	if (permissions.horizontalSecurity.type === HorizontalSecurityPolicies.private ||
	    permissions.horizontalSecurity.type === HorizontalSecurityPolicies.shared) {
		if (obj[ownerIdFieldName] !== userId ) {
			return false; //not owned
		}
	}
	var res = securityService.canExecuteOperation(permissions, { verb:'DELETE' });
	return res;
}

function addHalLink(context, key, href, verb) {
	if(!context || !context.doc || !context.doc._doc) {
		return;
	}
	if (!context.doc._doc._links) {
		context.doc._doc._links = {};
	}
	var link = {
		href: href
	};
	if (verb && verb !== 'GET') {
		link.verb = verb;
	}
	context.doc._doc._links[key] = link;
}

function authorizeRequestHook(req, res, next) {
	authorize(req, function (err, authorized) {
		var resourceKey = req.authz.operation.resource;
		if (err) {
			console.error(err);
			return res.status(500).json({ code:500, message: 'Error authorizing', error: err, resource: resourceKey });
		}
		if (!authorized) {
			return res.status(403).json({ code:403, message: 'Forbidden', resource: resourceKey });
		}
		next();
	});
}

function resourceNeedsOwnership(resource) {
	var schema = resource.schema;
	if (schema.paths[ownerIdFieldName]) {  //_ownerId is present?
		return true;
	}
	return false;
}
function setOwnership(req) {
	req.body[ownerIdFieldName] = getOwnerId(req); //set ownership
}

function getPermissionsFor(req, role, resource, cb) {
	if (!req.authz) {
		req.authz = {};
	}
	if (req.authz.permissions) {
		return cb(null, req.authz.permissions);
	}
	securityService.getPermissionsFor(role, resource, function(err, permissions) {
		if (err) {
			return cb(err, null);
		}
		req.authz.permissions = permissions;
		return cb(null, permissions);
	});
}

//Can the user execute this operation? Yes/No
//To be override by custom domain logic
function authorize(req, cb) {
	var operation = req.authz.operation;
	var user = req.user;

	//Admin functionality only accesible for Admin role
	if (utils.startsWith(operation.url, '/admin-') && user.role === 'Admin') {
		return cb(null, true);
	}

	//Authorize based on (user, role) versus (resource.operation) -> granted or not?	
	getPermissionsFor(req, user.role, operation.resource, function(err, permissions) {
		if (err) {
			console.error(err);
			return cb(err, null);
		}
	
		var canExecute = securityService.canExecuteOperation(permissions, operation);
		
		if (!canExecute) {
			return cb(null, false); //Not authorized to execute
		}
		//Can access the object specified via horizontal security?
		if (operation.objectIds && operation.objectIds.length > 0) {
			var canAccessObject = canUserAccessObject(permissions, user, operation, cb);
			req.authz.canAccessObject = canAccessObject; //cache it
			return canAccessObject;
		}
		//Authorize operation
		return cb(null, true);
	});
}

function canUserAccessObject(permissions, user, operation, cb) {
	if (operation.resource === null) {
		return cb(null, true);  //passtrought no resource	
	}
	var hSecPolicyType = securityService.getHorizontalPolicy(permissions, 'none');
	var accessQuery = canAccessObjectQuery(operation, user, hSecPolicyType);
	if (!accessQuery.access) {
		return cb(null, false);  //No access granted
	}
	if (accessQuery.access && !accessQuery.q) {
		return cb(null, true);  //No constraint on object visibility -> pass
	}
	var model = m.models[operation.resource].model;
	if (!model) {
		return cb(null, true);  //passtrought with no model		
	}
	model.find(accessQuery.q, function(err, docs) {
		if (err) {
			console.error(err);
			return (err, null);
		}
		if (docs && docs.length === operation.objectIds.length) {
			//authorized: object is visible
			return cb(null, true);
		}
		//not authorized: object not visible: forbidden
		return cb(null, false);
	});
}

function canAccessObjectQuery(operation, user, policy) {
	if (policy === HorizontalSecurityPolicies.private) {
		return {
			access : true,
			q : getQuery(operation.objectIds, user._id)
		};
	}
	else if (policy === HorizontalSecurityPolicies.shared) {
		//shared means: public for query, private for commands
		if (operation.verb === 'GET') {
			//pubic for query
			return  {
				access: true,
				q: null 
			};
		}
		//private for commands
		return {
			access: true,
			q: getQuery(operation.objectIds, user._id)
		};
	}
	else if (policy === HorizontalSecurityPolicies.public) {
		return  {
			access: true,
			q: null 
		};
	}
	else if (policy === HorizontalSecurityPolicies.none) {
		return  {
			access: false,
			q: null 
		};
	}
	else {
		//(same as public)
		return  {
			access: true,
			q: null 
		};
	}
}

function getQuery(objectIds, userId) {
	var query = {};
	query[idFieldName] = { $in: objectIds };
	query[ownerIdFieldName] =  userId;
	console.log('query: ' + JSON.stringify(query));
	return query;
}

function setHorizontalSecurity(req, res, next) {
	var resourceKey = req.authz.operation.resource;
	var role = getRole(req);
/*	var operation = { 
			verb: req.method,
			resource: resource,
			url: req.url,
			objectId: req.params.id			
	};
*/
	getPermissionsFor(req, role, resourceKey, function(err, permissions) {
		if (err) {
			console.error(err);
			return next();
		}		
		var policy = securityService.getHorizontalPolicy(permissions, HorizontalSecurityPolicies.public);
		setHorizontalSecurityPolicy(policy, req);
		return next();		
	});
}	

function setHorizontalSecurityPolicy(wellKnowPolicy, req) {
	var operation = req.authz.operation;
	var ownerId = getOwnerId(req); 
	var q = req.baucis.query;
	
	if ( wellKnowPolicy === HorizontalSecurityPolicies.public ||
		(wellKnowPolicy === HorizontalSecurityPolicies.shared && operation.verb==='GET')) {
		return;
	}
	if ( wellKnowPolicy === HorizontalSecurityPolicies.private || 
	    (wellKnowPolicy === HorizontalSecurityPolicies.shared && operation.verb!=='GET')) {
		q.where(ownerIdFieldName).equals(ownerId);
		return;
	}
	if (wellKnowPolicy === HorizontalSecurityPolicies.none) {
		 //Force no results z==false && z==true		 
		q.and([ { z: true}, {z: false} ]);
		return;
	}
}

function getOwnerId(req) {
	if (req && req.user && req.user._id) {
		return req.user._id.toString();
	}
	return null; //Not found
}
function getRole(req) {
	if (req && req.user && req.user.role) {
		return req.user.role;
	}
	return null; //Not found
}

//What attribute should be returned per role?
function filterAttributes(req, res, next) {
	var resourceKey = req.authz.operation.resource;
	var role = getRole(req);
	getPermissionsFor(req, role, resourceKey, function(err, permissions) {
		if (err) {
			console.error(err);
			return next();
		}
	
		var visibleFields = securityService.getFieldsToInclude(permissions);
		var removeFields = securityService.getFieldsToRemove(permissions);
		
		var selectFields = '';
		var prefix = '';
		
		if (visibleFields.length === 1 && visibleFields[0] === '*') {
			//see all - nothing to include
		} else {
			//include explicit fields: one by one:
			for(var i=0; i<visibleFields.length; i++) {
				var field = utils.toCamel(visibleFields[i]);
				selectFields += prefix + '+' + field;  //explicit add proyection
				prefix = ' ';
			}
		}
		
		if (removeFields.length > 0 ) {
			//remove explicit fields: one by one:
			for(var j=0; j<removeFields.length; j++) {
				var field2 = utils.toCamel(removeFields[j]);
				selectFields += prefix + '-' + field2;  //remove projection
				prefix = ' ';
			}
		}
		
		if (selectFields !== '') {
			//constraint response: modify projection via select
			req.baucis.query.select(selectFields); 
		}
		return next();	
	});
}


function extractResourcePath(path) {
	if (!path) {
		return null;
	}
	var parts = path.split('/');
	if (parts.length === 0) {
		return null;
	}
	else if (parts.length === 1) {
		return parts[0];
	}
	return parts[1];
}
function extractParamId(path) {
	//pending improvement use: regex to extract :id  expenses/55ffd84528859d201c0d2135
	if (!path) {
		return null;
	}
	var parts = path.split('/');
	if (parts.length < 3) {
		return null;
	}
	return parts[2];
}


function extractResource(resourcePath) {
	return hashedPathsToResourceNames[resourcePath] || null;
}

//Express middleware for extensions ---------------
//Identifies the resource, operation, object and retrieves permissions.
//Rejects the operation if not applicable
//Reject the operation if not applicable to object
function authorizeResourceOperationMiddleware(req, res, next) {
	var resourcePath = extractResourcePath(req.path);
	var resource = extractResource(resourcePath);
	var objectId = extractParamId(req.path);
	var operation = { 
			verb: req.method,
			resourcePath: resourcePath,
			resource: resource,
			url: req.url,
			//ObjectId needs to be parsed later at controller stage
			objectIds: objectId ? [objectId] : []
	};
	
	//Execute operation middlewares 
	for (var i = 0; i < operationMiddlewares.length; i++) {
		var middleware = operationMiddlewares[i];
		middleware(req, operation);
	}
	
	req.authz = {
		user: req.user,
		operation: operation
	};
	var role = getRole(req);
	//pending optimization: retrieve permissions for role + resource
	if (!role || !resource) {
		authorizeRequestHook(req, res, function() {
			next();
		});
	}	
	else {
		getPermissionsFor(req, role, resource, function(err, permissions) {
			if (err) {
				console.error(err);
				return res.status(500).json(err);
			}
			req.authz.permissions = permissions; //Add permissions to request
			
			authorizeRequestHook(req, res, function() {
				next();
			});
		});			
	}
}

function registerOperationMiddleware(middleware) {
	operationMiddlewares.push(middleware);
}

module.exports = {
	apply: 				apply,
	authorize: 			authorize,
	authorizeResourceOperationMiddleware : authorizeResourceOperationMiddleware,
	registerOperationMiddleware : registerOperationMiddleware 
};