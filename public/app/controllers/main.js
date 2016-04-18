angular.module('myApp').controller('MainController', 
  ['$scope', '$location', 'Session', 'SecurityService', 
  function ($scope, $location, Session, SecurityService) {

	$scope.userHasAdminRole = function() {
		return (Session && Session.userHasRole("Admin"));
	};
	function init() {
		$scope.serviceUriBase = $location.protocol() + '://' + $location.host() + ":" + $location.port();	
		SecurityService.whoAmI().then(function(httpData) {
			$scope.whoami = httpData.data;
			$scope.canAccessResource = {};
			for(var i=0; i< $scope.whoami.resources.length; i++) {
				var resource = $scope.whoami.resources[i];
				$scope.canAccessResource[resource.name] = resource;
			}
		});		
	}
	init();
}]);