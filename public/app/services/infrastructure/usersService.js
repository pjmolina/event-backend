angular.module('myApp').service('UsersService', ['$http', '$q', function ($http, $q) {

	var UsersService = {};
	var resourceUrl = '/api/admin-users';

	//-- Public API -----

	var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	UsersService.getRandomPass = function(charSize) {
		var res ='';
		for(var i=0; i<charSize; i++) {
			res += alphabet[Math.floor((Math.random() * alphabet.length))];
		}
		return res;
	};
	
	UsersService.getToEdit = function (id) {
		return $http.get(resourceUrl + '/' + id );
	};

	UsersService.getList = function () {
		return $http.get(resourceUrl);
	};

	UsersService.add = function (item) {
		return $http.post(resourceUrl, JSON.stringify(item));
	};

	UsersService.update = function (item) {
		return $http.put(resourceUrl + '/' + item._id, JSON.stringify(item));
	};

	UsersService.delete = function (id) {
		return $http.delete(resourceUrl + '/' + id);
	};

	return UsersService;
}]);
