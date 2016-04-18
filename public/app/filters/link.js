angular.module('myApp').filter('link', function() {
	return function(input) {
		if (input == null) {
			return '';
		}
		return '<a target="_blank" href="' + input + '">' + input + '</a>';  
	};
});