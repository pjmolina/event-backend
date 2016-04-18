angular.module('myApp').service('GeocodeService', ['$http', '$q', function ($http, $q) {
	var GeocodeService = {};

	var apiKey;
	GeocodeService.setApiKey = function(apikey) {
		this.apiKey = apikey;
	};
	GeocodeService.getGeoFromAddress = function (address) {
		var query = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address);

		if (apiKey!=null) {
			query += '&apikey=' + encodeURIComponent(apiKey);
		}
		return $http.get(query);
	};
	return GeocodeService;
}]);