var userProfileController = function ($scope) {
	$scope.login = function() {
		if ($scope.loginCallback) {
			$scope.loginCallback();
		}
	};
	$scope.logout = function() {
		if ($scope.logoutCallback) {
			$scope.logoutCallback();
		}
	};
};

userProfileController.$inject = ['$scope'];

angular.module('myApp').directive("userProfile", [function () {
	return {
		require: ['ngModel'],  
		controller: userProfileController,
		restrict: 'E',
		replace: true,
		scope: {
			session: "=ngModel",
			loginCallback: "=login",			
			logoutCallback: "=logout"			
		},
		templateUrl: '/app/directives/userProfile.html',

		link: function (scope, elem, attr, reqs) {
		}
	};
}]);