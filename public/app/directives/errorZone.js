angular.module('myApp').directive("errorZone", [function () {
    return {
        restrict: 'E',
        require: 'ngModel',
        replace: true,
        scope: {
            errors: '=ngModel'
        },
        templateUrl: '/app/directives/errorZone.html',

        link: function compile(scope, element, attrs) {
        }
    };
}]);
