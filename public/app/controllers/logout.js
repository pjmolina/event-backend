angular.module('myApp').controller('LogoutController', ['$scope', '$rootScope', '$cookies', 'AuthService', '$location', function ($scope, $rootScope, $cookies, AuthService, $location) {

	$scope.logout = function () {
		$rootScope.isLogged = false;	
		$rootScope.username = null; 
		$rootScope.session = {};

		$cookies.username = null;
		$cookies.password = null;
		
		AuthService.logout('').then(function(){
			$location.path('/');	
		});	
	};	
	  
}]);