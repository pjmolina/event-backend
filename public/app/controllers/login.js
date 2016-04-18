angular.module('myApp').controller('LoginController', ['$scope', '$rootScope', '$cookies', '$location', 'AuthService', 'ProvidersService', function ($scope, $rootScope, $cookies, $location, AuthService, ProvidersService) {

	$rootScope.isLogged = false;	
	$rootScope.username = null; 

	$scope.showProviders = false;
	$scope.credentials = {
		username : null,
		password : null,
		errorMessage: null
	};
	
	$scope.login = function () {
		AuthService.login($scope.credentials)
			       .then(loginOK, loginFailed);
	};
	
	function loginOK(res) {
		$scope.errorMessage = null;
		$rootScope.isLogged = true;
		$rootScope.username = res.username;
		$rootScope.session = res;
		if ($rootScope.requestedRoute) {
			var route = $rootScope.requestedRoute;
			$rootScope.requestedRoute = null;
			$location.path(route);
		} 
		else {
			$location.path('/');
		}				
	}
	function loginFailed(err) {
		$rootScope.isLogged = false;		
		$rootScope.username = null;
		$rootScope.session = {};
		$rootScope.password = null;
		
		//$scope.username = null;
		$scope.password = null;
		$scope.errorMessage = "Invalid user or password.";
	}
	
	function loadProviders(providers){
		$scope.providers = providers.filter(function (provider) {
			return provider.enable;
		});
		$scope.showProviders = $scope.providers.length > 0;
	}

	$scope.init = function () {
		ProvidersService.getList().then(loadProviders);
		AuthService.isAuthenticated().then(function (user) {
			if (user) {
				loginOK(user);
			}
		}, loginFailed);
	};
	
	$scope.init();
	  
}]);