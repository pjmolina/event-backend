//Init database
var securityService = require('../security/securityService');
var metamodel = require('../metamodel');

function ensureDefaultPermissions(PermissionsModel, role, models) {
	PermissionsModel.find({role: role}).exec(function(err, perms) {
		if (err) {
			return console.error(err);
		}
		Object.keys(models.models).forEach(function(key) { 
			var resource = models.models[key];
			if (!hasPermissionFor(resource, perms) && metamodel.getClassByName(resource.name) !== null ) {
				createDefaultPermissionForClass(PermissionsModel, role, resource.name);
			}
		});
	});
}
function hasPermissionFor(resource, perms) {
	if (perms === null) {
		return false;
	}
	for(var i=0; i<perms.length; i++) {
		var item = perms[i];
		if (item.resource.toLowerCase() === resource.name.toLowerCase()) {
			return true;
		}
	}
	return false;
}


function createDefaultPermissionForClass(PermissionsModel, role, resource) {
	//create default permissions for role + resource
	var perm = new PermissionsModel({
		role: 'Admin',
		resource : resource,
		horizontalSecurity : {
			type: 'public'
		},
		operations: {
			allow: ['*'],
			deny: []
		},
		fields: {
			allow: ['*'],
			deny: []
		}
	});
	perm.save(function(err, savedPerm) {
		if (err) {
			console.error(err);
		}
		if (savedPerm) {
			console.log("Created default permissions for " + 
						savedPerm.role + ":" + savedPerm.resource);
		}
	});
	
}

function createAccount(Model, accountName, pass, role) {
	var account = new Model();
	account.username = accountName;
	account.accountType = 'Local';
	account.password = pass;
	account.enabled = true;
	account.role = role;
	account.save(function (err, acc) {
		if (err) {
			console.error(err);
		}
		if (acc) {
			console.log("Account created for user: " + accountName + " with role: " + role);
		}
	});
}

function rootAccountExists(secInfo, UsersModel, cb) {
	UsersModel.findOne({ 'username': secInfo.rootAccount }, function (err, adminUser) {
  		return cb(err, adminUser);
  	});
}

function createRootAccount(secInfo, UsersModel) {
	//Create default user
	createAccount(UsersModel, secInfo.rootAccount, secInfo.apiKey, 'Admin');
}

function createDefaultProviders(ProvidersModel) {
	createProvider('Google', 1, ProvidersModel);
	createProvider('Facebook', 2, ProvidersModel);
	createProvider('Twitter', 3, ProvidersModel);
	createProvider('GitHub', 4, ProvidersModel);
	createProvider('Windowslive', 5, ProvidersModel);
}

function createProvider(name, order, ProvidersModel) {
	ProvidersModel.findOne({
		'name': name
	}, function (err, doc) {
		if (err === null && doc === null) {
			//if not found: create
			var provider = new ProvidersModel({
				name: name,
				enable : false,
				autoEnroll : false,
				defaultRole : 'Admin',
				order : order
			});
			provider.save(function (err, doc) {
				if (err) {
					console.error(err);
				}
				if (doc) {
					console.log("Provider " + name + " created.");
				}
			});
		}
	});
}

function ensureInitialData(secInfo, models) {
	var UsersModel = models.models._users.model;
	var PermissionsModel = models.models._permissions.model;
	var ProvidersModel = models.models._providers.model;
	
	//Create admin account (if missing)
	rootAccountExists(secInfo, UsersModel, function(err, user) {
		if (err) {
			console.error(err);
		}
		else if (!user) {
			createRootAccount(secInfo, UsersModel);
		}	
	});
	
	//Create default permissions (if missing)
	ensureDefaultPermissions(PermissionsModel, 'Admin', models);
	
	//Create default providers (if missing)
	createDefaultProviders(ProvidersModel);	
}

function apply(app, models, configuration) {
	securityService.apply(models);
	ensureInitialData(configuration.security, models);
}


module.exports = {
	apply : apply
};