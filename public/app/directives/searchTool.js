var searchToolController = function ($scope, $timeout) {

	var lastTimeoutTyping = null;

	$scope.searchContext = {
		pageSize: 12,
		searchText: '',
		totalItems: 0,
		isLoadingData: false	
	};
	//$scope.search = null;
	$scope.class = '';

	$scope.innerSearchText = '';

	$scope.clearSearch = function() {
		$scope.innerSearchText = '';
		invokeSearch();
	};

	$scope.typedTextSearch = function() {
		//await for end of typing (200ms) to avoid innecesary calls to server-side
		if (lastTimeoutTyping) {
			//cancel previous if pending
			$timeout.cancel(lastTimeoutTyping);
		}
		$scope.searchContext.isUserIsTyping = true;
		//delay for 200 ms just in case the user keeps typing
		lastTimeoutTyping = $timeout(invokeSearch, 200, true);
	};	

	var lastSearch = null;

	function invokeSearch() {
		$scope.searchContext.isUserIsTyping = false;
		lastTimeoutTyping = null;
		var isRepeatedSearch = (lastSearch == $scope.innerSearchText);
		lastSearch = $scope.innerSearchText;
		$scope.searchContext.searchText = $scope.innerSearchText;

		if ($scope.searchCallback && !isRepeatedSearch) {			
			$scope.searchCallback($scope.searchContext);
		}
	}

};

searchToolController.$inject = ['$scope', '$timeout'];

angular.module('myApp').directive("searchTool", [function () {
	return {
		controller: searchToolController,
		restrict: 'E',
		replace: true,
		//transclude: true,
		scope: {
			searchContext: '=ngModel',
			searchCallback: '=search',
			class:  '@class'
		},
		templateUrl: '/app/directives/searchTool.html',

		link: function (scope, elem, attr) {
		}
	};
}]);