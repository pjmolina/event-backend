angular.module('myApp').controller('AdminPermissionsController', 
  ['$scope', '$location', 'MetadataService', 'PermissionsService', 'EntityUtilService', 
  function ($scope, $location, MetadataService, PermissionsService, EntityUtilService) {

	var	PredefinedAdminRole = 'Admin';

	$scope.importFile = null;
	
	$scope.tab = 'Roles';
	$scope.currentRole = null;
	$scope.currentResource = null;
	$scope.currentPermission = null;
	$scope.currentResourceFields = null;
	$scope.newRoleName = null;
	$scope.canAddNewRole = false;
	
	$scope.roles = [];
	
	$scope.horizontalSecurityRules = [
		{ key: 'public', label:'Public', description:'Users in role can access and query over all instances in the resource.' },
		{ key: 'private', label:'Private', description:'Users in role can access and query only to instances owned by him/her in the resource.' },
		{ key: 'shared', label:'Shared', description:'Users in role can modify or delete owned instances (as private) but query all of them (as public).' },
		{ key: 'none', label:'None', description:'Users in role cannot access neither query instances in the resource.' }
	];
		
	$scope.resources = [];

	$scope.selectTab = function(tab) {
		$scope.tab = tab;
	};

	$scope.newRole = function(name) {
		var newRole = { name: name };
		$scope.roles.push(newRole);
		$scope.newRoleName = '';
		$scope.selectRole(newRole);

		validate();
	};
	$scope.deleteRole = function(role) {
		var index = $scope.roles.indexOf(role);
		if (index > -1) {
			$scope.roles.splice(index, 1);
			$scope.selectRole(null);
			PermissionsService.removePermissionsForRole(role.name)
							  .then(removeOk, removeFailed);
		}
	};
	
	
	function removeOk() {
		$scope.error = null;
		
		validate();
	}
	function removeFailed(httpError) {
		$scope.error = httpError;
	}
 
	$scope.canDeleteRole = function(role) {
		if (!role || role.name === PredefinedAdminRole) {
			return false;
		}
		return true;
	};

	$scope.selectRole = function(role) {
		unselectItems($scope.roles);
		if (role) {
			role.selected = true;		
		}
		$scope.currentRole = role;
		
		loadPermission(role, $scope.currentResource);
	};
	
	$scope.selectResource = function(resource) {
		unselectItems($scope.resources);
		resource.selected = true;
		$scope.currentResource = resource;
		
		loadPermission($scope.currentRole, resource);
	};
	
	$scope.onNewRoleInput = function() { //roleName
		updateCanAddNewRole();
	};
	
	function updateCanAddNewRole() {
		if (!$scope.newRoleName) {
			$scope.canAddNewRole = false;		
			return;
		}
		var role = getRole($scope.newRoleName);
		$scope.canAddNewRole = (role === null);
	}
	function getRole(roleName) {
		for(var i=0; i<$scope.roles.length; i++) {
			if (roleName === $scope.roles[i].name) {
				return $scope.roles[i];
			}
		}
		return null;
	}
	
	
	
	function unselectItems(list) {
		for(var i=0; i < list.length; i++) {
			var item = list[i];
			if (item.selected) {
				item.selected = false;
			}
		}
	}
	
	function loadPermission(role, resource) {
		saveCurrentPermission();

		$scope.currentPermission = null;
		if (!role || !resource) {
			$scope.currentPermission = null;
			return;
		}
		//$scope.currentRole = role;
		//$scope.currentResource = resource;
	
		PermissionsService.get(role.name, resource.name)
			.then(permissionLoaded, errorHandler);
	}
	
	function selectBy(col, key, value) {
		if (!col) {
			return null;
		}
		for(var i=0; i < col.length; i++) {
			if (col[i][key] === value) {
				return col[i];
			}			
		}
		return null;
	}
	
	function permissionLoaded(httpData) {
		if (httpData.data) {
			var perm = httpData.data;
			//Data. Load current permission set
			$scope.currentPermission = {
				title: setTitle(perm.role, perm.resource),
				role: perm.role,
				resource : perm.resource,
				operations : buildSelectedFromPerm($scope.currentResource.operations, perm.operations),
				horizontalSecurity: selectBy($scope.horizontalSecurityRules, 'key', perm.horizontalSecurity.type),
				fields: buildSelectedFromPerm($scope.currentResource.attributes, perm.fields)
			};		
		}
		else {
			//No data: load default one
			$scope.currentPermission = {
				title: setTitle($scope.currentRole.name, $scope.currentResource.name),
				role: $scope.currentRole.name,
				resource : $scope.currentResource.name,
				operations : buildOperations($scope.currentResource.operations),
				horizontalSecurity: $scope.horizontalSecurityRules[0],
				fields: buildFields($scope.currentResource.attributes)
			};
		}
	}
		
	function calculateSelection(name, allowList, allSelected, denyList, allDeny) {
		var selected = false;
		if (allSelected) {
			selected = true;
		}
		else {
			if (allowList.indexOf(name) > -1) {
				selected = true;	
			}
		}
		if (allDeny) {
			selected = false;
		}
		else {
			if (denyList.indexOf(name) > -1)
			{
				selected = false;	
			}
		}
		return selected;
	}
	function buildSelectedFromPerm(securizables, perms) {
		var res = [];	
		var allowList = perms.allow || [];
		var denyList  = perms.deny  || [];

		var allSelected = perms.allow.indexOf('*') > -1;
		var allDeny     = perms.deny.indexOf('*') > -1;
		
		if (securizables) {
			for(var i=0; i < securizables.length; i++) {
				var sec = securizables[i];
				var selected = calculateSelection(sec.name, allowList, allSelected, denyList, allDeny);
				var item = {
					name: sec.name,
					selected : selected
				};
				res.push(item);
			}
		}	
		return res;
	}
	
	
	function buildOperations(ops) {
		return buildFields(ops); //sample implementation
	}
	function buildFields(fields) {
		var res = [];
		if (fields) {			
			for(var i=0; i<fields.length; i++) {
				res.push({
					name: fields[i].name,
					selected: true
				});
			}
		}
		return res;
	}
	
	$scope.selectAllOperations = function() {
		setCol($scope.currentPermission.operations, 'selected', true);
	};
	$scope.selectNoneOperations = function() {
		setCol($scope.currentPermission.operations, 'selected', false);
	};
	$scope.selectAllFields = function() {
		setCol($scope.currentPermission.fields, 'selected', true);
	};
	$scope.selectNoneFields = function() {
		setCol($scope.currentPermission.fields, 'selected', false);
	};
	
	function setCol(col, property, value) {
		if (!col) {
			return;
		}
		for(var i=0; i<col.length; i++) {
			col[i][property] = value;
		}
	}
	
	function setTitle(role, resource) {
		if (!role || !resource) {
			return null;
		}
		return role + '-' + resource;
	}
	
	
	function saveCurrentPermission() {
		if ($scope.currentPermission) {
			var dtoPermission = buildDtoPermission($scope.currentPermission);
			PermissionsService.save(dtoPermission).then(saveOk, errorHandler);
		}		
	}

	$scope.saveCurrentPermission = saveCurrentPermission;
	
	function saveOk() { //data
		$scope.error = null;		
		validate();
	}
	function errorHandler(httpError) {
		$scope.error = httpError.data;
	}
	
	function buildDtoPermission(uiDto) {
		var res = {
			role : uiDto.role,
			resource : uiDto.resource,
			horizontalSecurity : {
				type: uiDto.horizontalSecurity.key
			},
			operations: buildAllowDenyDto(uiDto.operations),
			fields: buildAllowDenyDto(uiDto.fields)
		};
		return res;
	}
	function buildAllowDenyDto(items) {
		//var selected = items.filter(function(item) {
		//	return item.selected === true;	
		//});
		var nonSelected = items.filter(function(item) {
			return item.selected !== true;	
		});
		if (nonSelected.length === 0) {
			return {
				allow: [ '*' ],
				deny: []
			};		
		}
		return {
			allow: [ '*' ],
			deny: nonSelected.map(function(item) { return item.name; })
		};	
	}
	
	function getAvailableRoles(perms) {
		if (!perms || perms.length === 0) {
			//Default roles
			var res = [];
			res.push({
				 name: PredefinedAdminRole   //Default minimal role.
			});
			//res.push({
			//	 name: PredefinedUserRole   
			//});
			return res;
		}
		var roles = {};	
		for(var i=0; i < perms.length; i++) {
			var perm = perms[i];
			roles[perm.role] = perm.role;
		}
		var unique = [];
		for(var key in roles) {
			if (roles.hasOwnProperty(key)) {
				unique.push({name: key });						
			}
		}
		return unique;
	}
	
	function setValidationErrors(errors) {
		if (!errors || errors.length === 0) {
			$scope.validationErrors = null;	
			return;		
		}
		var textErrors = 'Permissions needs to be setup for: ';
		var prefix = '';
		for(var i=0; i<errors.length; i++) {
			var error = errors[i];
			textErrors += prefix + '<code>' + error.role + ':' + error.resource + '</code>';
			prefix =', ';
		}
		textErrors += '.';
		
		$scope.validationErrors = textErrors;
	}
	function validatePermissions(perms) {
		var errors = [];
		for(var i=0; i<$scope.roles.length; i++) {
			var role = 	$scope.roles[i].name;
			for(var j=0; j<$scope.resources.length; j++) {
				var resource = 	$scope.resources[j].name;
				
				var perm = getPerm(perms, role, resource);
				if (!perm) {
					errors.push({
						role: role,
						resource: resource,
						type: 'permissionNotConfigured'
					});
				}
			}
		}
		setValidationErrors(errors);
		return errors;
	}
	
	function getPerm(perms, role, resource) {
		if (!perms) {
			return null;
		}
		var perm = perms.filter(function(item) {
			return (item.role.toLowerCase() === role.toLowerCase()) && 
				   (item.resource.toLowerCase() === resource.toLowerCase());
		});
		if (perm.length === 0) {
			return null;
		}
		return perm[0];
	}
	
	$scope.export = function() {
		PermissionsService.getAll().then(function(httpData) {
			EntityUtilService.sendFile(httpData.data, 'security.json', 'application/json');
		});		
	};
	$scope.import = function() {
		try {
			var r = new FileReader();
			r.onload = function(e) { 
				var contents = e.target.result;
				try {
					var security = JSON.parse(contents);
					PermissionsService.importSecurity(security)
					                  .then(importOk, importFailed);						
				}
				catch(ex) {
					$scope.error = ex;				
				}
			};
			r.readAsText($scope.importFile);
		} catch (e) {
			$scope.error = e;
		}
	};
	
	function importOk() { //httpData
		$scope.error = null;
		$scope.importResult = "Import finished.";
		$scope.importFile = null;
		$scope.currentResource = null;
		$scope.currentPermission = null;

		validate();
	}
	function importFailed(httpError) {
		$scope.error = null;
		$scope.importResult = httpError;

		validate();
	}
	
	function validate() {
		PermissionsService.getAll().then(function(httpData) {
			//$scope.roles = getAvailableRoles(httpData.data);
			validatePermissions(httpData.data);
		});
	}
	function reloadRoles() {
		PermissionsService.getAll().then(function(httpData) {
			$scope.roles = getAvailableRoles(httpData.data);
		});
	}


	function init() {
		MetadataService.getRootClasses().then(function(rootClasses) {
			$scope.resources = rootClasses; //Exclude embeded classes
		});
		reloadRoles();
		validate();
	}

	init();	
}]);