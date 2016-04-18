angular.module('myApp').factory('AuthService', ['$http', 'Session', function($http, Session) {

	var authService = {};

	authService.login = function (credentials) {
		var cred = base64Encode(credentials.username +':'+ credentials.password);
		var opts = {
			headers: {
				'Authorization' : 'Basic ' + cred
			}
		};
		return $http
			.post('/webLogin', credentials, opts)
			.then(logOk);
	};
	
	function logOk(httpResponse) {
		var data = httpResponse.data;
		Session.create(data.id, data.user.id, data.user.role);
		return data.user;
	}
	
	authService.logout = function (credentials) {
		return $http.post('/webLogout', credentials);
	};

	authService.isAuthenticated = function () {
		return $http.get('/loggedin').then(function (response) {
			if (response.data.loggedin === 1 && response.data.user) {
				return logOk(response);
			}
			else {
				return null;
			}
		});
	};

	function base64Encode(input) {
		var keyStr = 'ABCDEFGHIJKLMNOP' +
            'QRSTUVWXYZabcdef' +
            'ghijklmnopqrstuv' +
            'wxyz0123456789+/' +
            '=';

		var output = "";
		var chr1, chr2, chr3 = "";
		var enc1, enc2, enc3, enc4 = "";
		var i = 0;

		do {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
					keyStr.charAt(enc1) +
					keyStr.charAt(enc2) +
					keyStr.charAt(enc3) +
					keyStr.charAt(enc4);
			chr1 = chr2 = chr3 = "";
			enc1 = enc2 = enc3 = enc4 = "";
		} while (i < input.length);

		return output;
	}

	return authService;
}]);