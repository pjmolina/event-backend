var fileSelectorController = function ($scope) {
	$scope.property = null;

	$scope.canAddFile = true;
	$scope.showFile = true;
	
	$scope.delete = function() {
		$scope.property = null;		
		$scope.inputControl.value = '';
	};	
};
fileSelectorController.$inject = ['$scope'];

angular.module('myApp').directive("fileSelector", [function () {
	
	var uniqueId = 0;
	
	return {
		controller: fileSelectorController,
		restrict: 'E',
		replace: true,
		scope: {
			id:		  "@",
			property: "=ngModel",
			readonly: "=readonly",
			required : "=ngRequired",
			accept:	  "@",
			options:  "@"
		},
		templateUrl: '/app/directives/fileSelector.html',

		link: function (scope, elem, attr) {
			
			scope.accept = scope.accept || '*/*';
			
			var idInput;
			if (elem.attr('id') == null) {
				scope.id = 'fileSelector' + uniqueId++;
				idInput = 'input' + scope.id;
				elem.find('input').attr('id', idInput);
			} else {
				scope.id = elem.attr('id');
				idInput = scope.id;
			}
			
			scope.inputControl = elem.find('input')[0];
			
			elem.find('input').bind("change", function (changeEvent) {
				scope.$apply(function () {
					scope.property = changeEvent.target.files[0];
				});
			});

			scope.showFile = true;
			scope.canAddFile = !scope.readonly;
			scope.canDeleteFile = !scope.readonly;
			
		}
	};
}]);