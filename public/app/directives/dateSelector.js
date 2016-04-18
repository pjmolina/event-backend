var dateSelectorController = function ($scope) {
	$scope.openedDialog = false;
	
	$scope.dateOptions = {
		showWeeks: false,
		startingDay: 1
	};

	$scope.openCalendar = function(e) {
		e.preventDefault();
		e.stopPropagation();
		$scope.openedDialog = true;
	};	
	$scope.dateOptions = {
		formatYear: 'yyyy',
		startingDay: 0
	};
};

dateSelectorController.$inject = ['$scope'];

angular.module('myApp').directive("dateSelector", [function () {
	return {
		require: 'ngModel',
		controller: dateSelectorController,
		restrict: 'E',
		replace: true,
		scope: {
			placeholder: "@",
			ngModel: '=ngModel',
			readonly : "=ngReadonly",
			required : "=ngRequired"
		},
		templateUrl: '/app/directives/dateSelector.html',

		link: function (scope, elem, attr) {
			if (scope.placeholder) {
				elem.find('input').attr('placeholder', scope.placeholder);				
			}
		}
	};
	
}]);