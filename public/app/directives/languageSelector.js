var languageSelectorController = function ($scope) {
	$scope.onChange = function() {
		if ($scope.onlanguageChangedCallback) {
			$scope.onlanguageChangedCallback($scope.language);
		}
	};
};
languageSelectorController.$inject = ['$scope'];

angular.module('myApp').directive("languageSelector", [function () {
	return {
		controller: languageSelectorController,
		restrict: 'E',
		replace: true,
		scope: {
			language: "=ngModel",
			languages: "=languages",
			onlanguageChangedCallback: "=onChange"		
		},
		templateUrl: '/app/directives/languageSelector.html',

		link: function (scope, elem, attr) {
		}
	};
}]);