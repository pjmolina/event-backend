angular.module('myApp').directive("htmlCellDisplay", [function () {
	return {
		restrict: 'A',
		require: 'ngModel',
		replace: true,
		scope: {
			props: '=htmlCellDisplay',
			ngModel: '=ngModel'
		},
		link: function compile(scope, element, attrs) {
			scope.$watch('ngModel', function (value) {
				if (value == null) {
				    element.html('');
				} 
				else {
				    var html = "<div ta-bind class='htmlCellDisplay'>"+ value +"</div>";
				    element.html(html);
				}
			});
		}
	};
}]);