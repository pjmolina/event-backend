//Security Service - MongoDB implementation -------

var permissionModel;

function apply(models) {
	permissionModel =  models.models._permissions.model;
}

//Get permissions for a given <role, resource> or null if not found
function getPermissionsFor(role, resource, cb) {
	if (!role || !resource) {
		return cb(null, null);
	}
	permissionModel.findOne({
			role: role, 
			resource: {$regex: new RegExp('^' + resource.toLowerCase(), 'i')}
		}, function(err, perm) {
		if (err) {
			return cb(err, null);
		}
		return cb(null, perm);
	});
}

//Get all permissions for role (in all resources)
function getAllPermissionsForRole(role, cb) {
	if (!role) {
		return cb(null, null);
	}
	permissionModel.find({
			role: role
		}, function(err, perms) {
		if (err) {
			return cb(err, null);
		}
		return cb(null, perms);
	});
}


//Get role names configured in security
function getRoles(cb) {
	permissionModel.distinct('role', {}, function(err, result) {
		if (err) {
			return cb(err, null);
		}
		return cb(null, result);
	});	
}

//Get resource names configured in security
function getResources(cb) {
	permissionModel.distinct('resource', {}, function(err, result) {
		if (err) {
			return cb(err, null);
		}
		return cb(null, result);
	});	
}

function canExecuteOperation(permissions, operation) {
	if (operation.resource === null) {
		return true;
	}
	var allowList = null;
	var denyList = null;
	if (permissions && permissions.operations) {
		allowList = permissions.operations.allow;
		denyList = permissions.operations.deny;
	}
	
	var operationKey = translateToOperationKey(operation);
	
	var isInAllow = isInAcl(allowList, operationKey, false);
	var isInDeny = isInAcl(denyList, operationKey, false);
	if (isInAllow && !isInDeny) {
		return true;
	}
	return false;
}

function translateToOperationKey(operation) {
	var verb = operation.verb.toUpperCase();
	if (verb === 'POST') {
		return 'create';		
	}
	else if (verb === 'PUT') {
		return 'update';		
	}
	if (verb === 'GET') {
		return 'query';		
	}
	if (verb === 'DELETE') {
		return 'delete';		
	}
	return verb + ' ' + operation.url;
}

function getHorizontalPolicy(permissions, defaultValueOnNoData) {
	if (permissions && permissions.horizontalSecurity && permissions.horizontalSecurity.type) {
		return  permissions.horizontalSecurity.type;
	}
	return defaultValueOnNoData || 'public'; 
}
function getFieldsToInclude(permissions) {
	if (permissions && permissions.fields && permissions.fields.allow) {
		return permissions.fields.allow;
	}
	return ['*']; //Default: show all fields
}
function getFieldsToRemove(permissions) {
	if (permissions && permissions.fields && permissions.fields.deny) {
		return permissions.fields.deny;
	}
	return []; //Default: do not hide fields
}

function isInAcl(list, key, defaultValueOnNoData) {
	if (!list) {
		return defaultValueOnNoData;
	}
	var normalizedKey = key.toLowerCase();
	for(var i=0; i<list.length; i++) {
		var item = list[i];
		if (item === '*' || item.toLowerCase() === normalizedKey) {
			return true;
		}
	}
	return false;
}


function canAccessToResource(role, resourceName, permission) {
	if (!permission) {
		return false;
	}
	if (permission.resource.toLowerCase() === resourceName.toLowerCase()) {
		//permission found
		if (role === 'Admin') {
			return true; //superAdmin
		}
		var policy = getHorizontalPolicy(permission, 'none');
		if (policy === 'none') {
			return false;
		}
		if (!canExecuteOperation(permission, {verb: 'GET'})) {
			return false;			
		}
		return true;
	}
	return false;
}
function getAllowedOperations(permission) {
	var allowList = [];
	var denyList = [];
	if (permission && permission.operations) {
		allowList = permission.operations.allow;
		denyList = permission.operations.deny;
	}
	var baseOperations = ['query', 'create', 'update', 'delete'];
	var allowList1 = expandList(allowList, baseOperations);
	var denyList1 = expandList(denyList, baseOperations);
	var result = removeDenied(allowList1, denyList1);
	return result;
}
//If * is found as an item, expanded items will be added with no duplications to the list
function expandList(list, expandedItems) {
	if (!list) {
		return [];
	}
	var startIndex = list.indexOf('*');
	if (startIndex != -1) {
		list.splice(startIndex, 1);
		//add expended items
		for(var i=0; i<expandedItems.length; i++) {
			var item = expandedItems[i];
			if (list.indexOf(item) === -1) {
				list.push(item);
			}
		}
	}
	return list;
}

function removeDenied(included, denied) {
	var res = [];
	for(var i=0; i<included.length; i++) {
		var item = included[i];
		if (denied.indexOf(item) === -1) {
			res.push(item);
		}
	}
	return res;
}

module.exports = {
	apply : apply,		
	getRoles : getRoles,
	getResources : getResources,
	getPermissionsFor : getPermissionsFor,
	getAllPermissionsForRole : getAllPermissionsForRole,
	getAllowedOperations : getAllowedOperations,
	canAccessToResource : canAccessToResource,
	canExecuteOperation : canExecuteOperation,
	getHorizontalPolicy : getHorizontalPolicy,
	getFieldsToInclude : getFieldsToInclude,
	getFieldsToRemove : getFieldsToRemove	
};