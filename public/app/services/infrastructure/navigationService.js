angular.module('myApp').service('NavigationService', [function () {
	var NavigationService = {};
	
	var urlStack = [];

	NavigationService.push = function (url, key, state) {
		var navItem = {
			url: url,
			key: key,
			state: state,
			returnData: null
		};
		urlStack.push(navItem);
	};
	NavigationService.pop = function () {
		return urlStack.pop();
	};
	
	NavigationService.getReturnUrl = function () {
		if (urlStack.length === 0) {
			return null;
		}
		return urlStack[urlStack.length - 1].url;
	};

	NavigationService.getState = function () {
		if (urlStack.length === 0) {
			return null;
		}
		return urlStack[urlStack.length - 1].state;
	};

	NavigationService.setReturnData = function(retData) {
		if (urlStack.length === 0) {
			return null;
		}
		urlStack[urlStack.length - 1].returnData = retData;
	};

	NavigationService.getreturnData = function() {
		if (urlStack.length === 0) {
			return null;
		}
		return urlStack[urlStack.length - 1].returnData;
	};
	NavigationService.isReturnFrom = function(key) {
		if (urlStack.length === 0) {
			return null;
		}
		return urlStack[urlStack.length - 1].key == key;
	};

	return NavigationService;
}]);