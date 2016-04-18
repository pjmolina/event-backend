angular.module('myApp').controller('ListPlaceController', 
  ['$http', '$scope', '$location', '$q', '$timeout', '$modal', 'SecurityService', 'NavigationService', 'EntityUtilService', 'PlaceService', 
  function($http, $scope, $location, $q, $timeout, $modal, SecurityService, NavigationService, EntityUtilService, PlaceService) {

	$scope.dataList = [];
	$scope.selectionContext = {
		allSelected:  false,
		noneSelected: true
	};
	$scope.searchContext = {
		sort: {},
		pageSize: 12,
		currentPage: 1,
		searchText: '',
		totalItems: 0,
		isSearching: false	
	};
	$scope.ui = {
		dropdown : {
			isOpen : false
		},
		canAdd : false,
		canQuery : false,
		canUpdate : false,
		canDelete : false
	};

	$scope.sortBy = function(field) {
		EntityUtilService.sortBy($scope.searchContext, field);
		$scope.refresh();
	};

	$scope.add = function () {
		$location.path('/place/add');
	};

	$scope.edit = function (obj) {
		$location.path('/place/edit/' + obj._id);
	};
	$scope.view = function (obj) {
		$location.path('/place/view/' + obj._id);
	};
	$scope.delete = function (obj) {
		$location.path('/place/delete/' + obj._id);
	};
	$scope.canEdit = function(obj) {
		return EntityUtilService.hasActionCapability(obj, 'edit');
	};
	$scope.canDelete= function(obj) {
		return EntityUtilService.hasActionCapability(obj, 'delete');		
	};	

	//masive deletion -----
	$scope.deleteByQuery = function() {
		$scope.ui.dropdown.isOpen = false;
		var modalInstance = $modal.open({
			templateUrl: '/views/confirmDeletionDialog.html',
			controller: 'ConfirmDeletionDialogController',
			resolve: {
				data: function() {
					return {
						titleKey: 'dialog.confirm.delete.title',
						messageKey: 'dialog.confirm.delete.message.filtered',
						count: $scope.searchContext.totalItems
					};
				}
			}
		});
		modalInstance.result.then(function () { //selectedItem
			doDeleteByQuery();
		}, function () {
			//Cancel - Nothing to do.
		});
	};
		
	function doDeleteByQuery() {
		var searchCriteria = {
			'searchText' : $scope.searchContext.searchText
		};
		return EntityUtilService.deleteByQuery(PlaceService, searchCriteria, $scope.refresh);  		
	}

	$scope.deleteSelected = function() {
		$scope.ui.dropdown.isOpen = false;
		var modalInstance = $modal.open({
			templateUrl: '/views/confirmDeletionDialog.html',
			controller: 'ConfirmDeletionDialogController',
			resolve: {
				data: function() {
					return {
						titleKey: 'dialog.confirm.delete.title',
						messageKey: 'dialog.confirm.delete.message.selected',
						count: $scope.getSelectedItems().length
					};
				}
			}
		});
		modalInstance.result.then(function () { //selectedItem
			doDeleteSelected();
		}, function () {
			//Cancel - Nothing to do.
		});			
	};
	
	function doDeleteSelected() {
		EntityUtilService.deleteSelected(PlaceService, $scope.dataList, $scope.refresh);  
	}

	//selection -----
	$scope.getSelectedItems = function() {
		return EntityUtilService.getSelectedItems($scope.dataList);  
	};
	$scope.selectItem = function (item, event) {
		return EntityUtilService.selectItem($scope.dataList, $scope.selectionContext, item, event);  
	};
	$scope.selectAll = function (event) {
		return EntityUtilService.selectAll($scope.dataList, $scope.selectionContext, event);  
	};

	// import / export ----
	$scope.importData = function () {
		$scope.ui.dropdown.isOpen = false;
		NavigationService.push($location.path());
		$location.path('/import/place');		
	};
	$scope.exportAs = function (format) { 
		EntityUtilService.exportAsFormat(
			format, { 
				'paginate'   : false,
				'searchText' : $scope.searchContext.searchText,
				'sort'		 : $scope.searchContext.sort
			},
			PlaceService, "places", $scope);
		$scope.ui.dropdown.isOpen = false;
	};
	//-----------------------------

	
	$scope.loadCurrentPage = function () {
		$scope.dataReceived = false;
		$scope.searchContext.isSearching = true;
		PlaceService.getList({ 
			'page'       : $scope.searchContext.currentPage,
			'pageSize'   : $scope.searchContext.pageSize,
			'searchText' : $scope.searchContext.searchText,
			'sort'		 : $scope.searchContext.sort
		})
		.then(onLoadData)
		.catch(onError)
		.finally(onLoadDataFinally);
	};	

	function onLoadData(httpResponse) {
		$scope.dataList = httpResponse.data;
	} 
	function onError(err) {
		if (err) {
			$scope.error = err;
			//console.error(err);
		}
	}
	function onLoadDataFinally() {
		$scope.searchContext.isSearching = false;
		$scope.dataReceived = true;
		$scope.$digest();
	} 	
	
	$scope.updateRecordCount = function () {
		$scope.searchContext.totalItems = null;
		PlaceService.getCount({ 
			'searchText' : $scope.searchContext.searchText
		})
		.then(onUpdateCount, onError);
	};

	function onUpdateCount(httpResponse) {
		$scope.searchContext.totalItems = Number(httpResponse.data);
	} 

	$scope.refresh = function () {
		$scope.updateRecordCount();
		$scope.searchContext.currentPage = 1;
		$scope.loadCurrentPage();
	};

	function canExecute(permissions, operation) {
		if (!permissions || !permissions.allowedOperations) {
			return false;
		}
		return permissions.allowedOperations.indexOf(operation) !== -1;
	}

	function init() {
		SecurityService.getPermisionsFoResource('place').then(function(httpData) {
			$scope.ui.canAdd = canExecute(httpData.data, 'create'); 
			$scope.ui.canQuery = canExecute(httpData.data, 'query'); 
			$scope.ui.canUpdate = canExecute(httpData.data, 'update'); 
			$scope.ui.canDelete = canExecute(httpData.data, 'delete'); 
		});
		$scope.refresh();
	}

	init();
}]);
