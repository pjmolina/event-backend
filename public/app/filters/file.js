angular.module('myApp').filter('file', function() {
	return function(input) {
		if (!input) {
			return null;
		}
		if (isFile(input)) {
			return '...';
		}
		return input;
	};
	
	function isFile(item) {
		if (!item || !item.constructor || !item.constructor.name) {
			return false;
		}
		return (item.constructor.name === 'File');
	}
});