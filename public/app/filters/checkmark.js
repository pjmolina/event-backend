angular.module('myApp').filter('checkmark', function() {
	return function(input) {
		if (input == null) {
			return '-';
		}
		return input ? '\u2713' : '\u2718';  
	};
});