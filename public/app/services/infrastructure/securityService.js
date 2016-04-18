angular.module('myApp').service('SecurityService', ['$http', function ($http) {
	function whoAmI() {
		return $http.get('/api/whoami');
	}	  
	function getPermisionsFoResource(resourceName) {
		return $http.get('/api/security/' + encodeURIComponent(resourceName));
	}	  
	  
  	var SecurityService = {
		whoAmI : whoAmI,
		getPermisionsFoResource : getPermisionsFoResource
	};	  
	return SecurityService;
}]);