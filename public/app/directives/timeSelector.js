var timeSelectorController = function ($scope) {
	$scope.openedDialog = false;
	
	$scope.openCalendar = function(e) {
		e.preventDefault();
		e.stopPropagation();
		$scope.openedDialog = true;
	};	
	
	$scope.timeOptions = {
		readonlyInput: false,
		showMeridian: false
	};	
};

timeSelectorController.$inject = ['$scope'];

angular.module('myApp').directive("timeSelector", [function () {
	return {
		require: ['ngModel'], 
		controller: timeSelectorController,
		restrict: 'E',
		replace: true,
		scope: {
			ngModel: '=ngModel',
			readonly : "=ngReadonly",
			required : "=ngRequired"
		},
		templateUrl: '/app/directives/timeSelector.html',

		link: function (scope, elem, attr) {
		}
	};
	
}]);