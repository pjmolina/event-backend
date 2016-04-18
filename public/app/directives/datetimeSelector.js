var dateTimeSelectorController = function ($scope) {
	$scope.openedDialog = false;

	$scope.dateOptions = {
		showWeeks: false,
		startingDay: 1
	};

	$scope.timeOptions = {
		readonlyInput: false,
		showMeridian: false
	};
	
	$scope.openCalendar = function(e) {
		e.preventDefault();
		e.stopPropagation();
		$scope.openedDialog = true;
	};	
};

dateTimeSelectorController.$inject = ['$scope'];

angular.module('myApp').directive("datetimeSelector", [function () {

	return {
		require: 'ngModel',
		controller: dateTimeSelectorController,
		restrict: 'E',
		replace: true,
		scope: {
			placeholder: "@",
			ngModel: '=ngModel',
			readonly : "=ngReadonly",
			required : "=ngRequired"
		},
		templateUrl: '/app/directives/datetimeSelector.html',

		link: function (scope, elem, attr) {
			if (scope.placeholder) {
				elem.find('input').attr('placeholder', scope.placeholder);				
			}
		}
	};
	
}]);