angular.module('myApp').controller('TopController', ['$scope', '$rootScope', '$location', '$translate', 'Session', function ($scope, $rootScope, $location, $translate, Session) {
	$scope.serviceUriBase = $location.protocol() + '://' + $location.host() + ":" + $location.port();	

	$scope.languages = [{
		id: 'en-US',
		label: 'English (US)'
	},{
		id: 'es-ES',
		label: 'Español (ES)'
	}];

	$scope.languageChanged = function(langIsoCode) {
		$rootScope.currentLanguage = langIsoCode;
		$translate.use(langIsoCode);
		$translate.refresh();
	};

	$scope.login = function() {
		$location.path('/login');
	};
	$scope.logout = function() {
		$location.path('/logout');
	};

	function init() {
		$rootScope.currentLanguage = $translate.proposedLanguage();
	}

	init();

}]);