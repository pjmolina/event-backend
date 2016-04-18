angular.module('myApp').directive("urlDisplay", [function () {

    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
    return {
        restrict: 'A',
        require: 'ngModel',
        replace: true,
        scope: {
            props: '=urlDisplay',
            ngModel: '=ngModel'
        },
        link: function compile(scope, element, attrs) {
            scope.$watch('ngModel', function (value) {
                if (urlPattern.test(value)) {
                    var html = '<a target="_blank" href="' + value + '">' + value + '</a>';
                    element.html(html);
                }
                else {
                    element.html(value);
                }
            });
        }
    };
	
}]);
