angular.module('myApp').directive("fileread", [function () {

	return {
		scope: {
			fileread: "="
		},
		link: function (scope, element) {
			element.bind("change", function (changeEvent) {
				scope.$apply(function () {
					scope.fileread = changeEvent.target.files[0];
				});
			});
		}
	};
	
}]);
