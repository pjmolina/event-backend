angular.module('myApp').directive("sortColumn", [function () {
    return {
        restrict: 'E',
        require: 'ngModel',
        replace: true,
        scope: {
            ngModel: '=ngModel'
        },
        link: function compile(scope, element, attrs) {
            scope.$watch('ngModel', function (value) {
                if (value === null) {
                    element.html('');
                } else if (value === true) {
                    var html1 = ' <span class="glyphicon glyphicon-sort-by-alphabet"></span>';
                    element.html(html1);
                }
                else if (value === false) {
                    var html2 = ' <span class="glyphicon glyphicon-sort-by-alphabet-alt"></span>';
                    element.html(html2);                    
                }
                
            });
        }
    };
	
}]);
