/**
 * the HTML5 autofocus property can be finicky when it comes to dynamically loaded
 * templates and such with AngularJS. Use this simple directive to
 * tame this beast once and for all.
 *
 * Usage:
 * <input type="text" autofocus>
 * 
 * License: MIT
 */
angular.module('myApp').directive('autoFocus', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, $element) {
            $scope.$watch('dataReceived', function() {
                if ($scope.dataReceived) {
                    $timeout(function() {
                        $element[0].focus();
                    }, 100);
                }
            });
        }
    };
}]);