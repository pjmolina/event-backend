var tristateController = function ($scope, $translate) {

    $scope.toggle = function(newValue) {
        if ($scope.readonly) {
            return; 
        }
        $scope.ngModel = newValue;
    };  

    function init() {
        ensureValueFor('noLabel', 'directive.tristate.label.no');
        ensureValueFor('yesLabel', 'directive.tristate.label.yes');
        ensureValueFor('nullLabel', 'directive.tristate.label.null');
    }

    function ensureValueFor(scopeKey, translationKey) {
        if (!$scope[scopeKey]) {
            $translate(translationKey).then(function(translation) {
                $scope[scopeKey] = translation;
            });
        } 
    }

    init();
};

tristateController.$inject = ['$scope', '$translate'];

angular.module('myApp').directive("tristate", [function () {
    return {
        controller: tristateController,
        restrict: 'E',
        require: 'ngModel',
        replace: true,
        scope: {
            ngModel: '=ngModel',
            readonly : "=ngReadonly",
            required : "=ngRequired",
            noLabel  : "@",
            yesLabel : "@",
            nullLabel : "@",
            hideNullButton: "@"
        },
        templateUrl: '/app/directives/tristate.html',

        link: function compile(scope, element, attrs) {
        }
    };
	
}]);