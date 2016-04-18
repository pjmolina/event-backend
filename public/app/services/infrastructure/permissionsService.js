angular.module('myApp').service('PermissionsService', 
  ['$http', '$q', 'baseApi', 
  function ($http, $q, baseApi) {

	var resourceUrl = baseApi + '/admin/permissions';

	function get(role, resource) {
		var uri = resourceUrl + '/' + encodeURIComponent(role) + '/' + encodeURIComponent(resource);
		return $http.get(uri);
	}
	function save(doc) {
		var uri = resourceUrl;
		return $http.post(uri, doc);
	}
	function removePermissionsForRole(role) {
		var uri = resourceUrl + '/' + encodeURIComponent(role);
		return $http.delete(uri);
	}
	function remove(role, resource) {
		var uri = resourceUrl + '/' + encodeURIComponent(role) + '/' + encodeURIComponent(resource);
		return $http.delete(uri);
	}
	function removeAll() {
		return $http.delete(resourceUrl);		
	}
	
	function getAll() {
		var uri = resourceUrl;
		return $http.get(uri);
	}
	function importSecurity(security) {
		var uri = resourceUrl + '-import';
		return $http.post(uri, security);
	}
	function getAllRoles() {
		var q = $q.defer();
		getAll().then(function (httpData) {
			var roles = getRolesFromPermissions(httpData.data);
			q.resolve(roles);
		}, function(err) {
			q.reject(err);
		});
		return q.promise;
	}
	var	PredefinedAdminRole = 'Admin';
	
	function getRolesFromPermissions(perms) {
		if (!perms || perms.length === 0) {
			//Default roles
			var res = [];
			res.push({
				name: PredefinedAdminRole   //Default minimal role.
			});
			return res;
		}
		var roles = {};	
		for(var i=0; i < perms.length; i++) {
			var perm = perms[i];
			roles[perm.role] = perm.role;
		}
		var uniqueRoles = [];
		for(var key in roles) {
			if (roles.hasOwnProperty(key)) {
				uniqueRoles.push({name: key });						
			}
		}
		return uniqueRoles;
	}

	var PermissionsService = {
		getAll : getAll,
		get : get,
		save : save,
		remove : remove,
		removePermissionsForRole : removePermissionsForRole,
		removeAll : removeAll,
		importSecurity : importSecurity,
		getAllRoles : getAllRoles
	};
	return PermissionsService;
}]);