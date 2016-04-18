angular.module('myApp').service('ProvidersService', ['$http', 'baseApi', function ($http, baseApi) {

	var ProvidersService = {};
	var resourceUrl = baseApi + '/admin/providers';
	var updateUrl = baseApi + '/admin-providers';
	var publicUrl = '/providers';
	
	//-- Public API -----
	ProvidersService.getList = function (protectedApi) {
		return $http.get(protectedApi ? resourceUrl : publicUrl).then(function (response) {
			var providers = response.data;
			providers.sort(function (a, b) {
				return a.order - b.order;
			});
			return providers;
		});
	};

	ProvidersService.update = function (item) {
		return $http.put(updateUrl + '/' + item._id, JSON.stringify(item));
	};

	return ProvidersService;
}]);
