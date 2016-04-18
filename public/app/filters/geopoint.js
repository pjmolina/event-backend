angular.module('myApp').filter('geopoint', function() {
	return function(geoPoint, precision) {
		precision = precision || 6;
		if (geoPoint != null && 
			geoPoint.coordinates.length === 2 &&
			geoPoint.coordinates[1] &&
			geoPoint.coordinates[0]) {
			return '[' + toFixed(geoPoint.coordinates[1], precision) + 
					', ' + toFixed(geoPoint.coordinates[0], precision) + ']';		
		}
		else {
		 	return '-';		
		}
	};
	//standard toFixed() has bugs in some browsers (IE saga). Thus: custom safe implementation
	function toFixed(value, precision) {
		var power = Math.pow(10, precision || 0);
		return String(Math.round(value * power) / power);
	}
});