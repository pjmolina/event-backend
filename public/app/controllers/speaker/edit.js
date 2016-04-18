angular.module('myApp').controller('EditSpeakerController', 
  ['$scope', '$routeParams', '$location', '$translate', '$timeout', 'UserErrorService', 'NavigationService', 'EntityUtilService', 'SecurityService', 'SpeakerService', 
  function($scope, $routeParams, $location, $translate, $timeout, UserErrorService, NavigationService, EntityUtilService, SecurityService, SpeakerService) {

	$scope.isEdition = false;
	$scope.isCreation = false;
	$scope.isDeletion = false;
	$scope.isView = false;
	$scope.canEdit = false;
	$scope.canDelete = false;	
	$scope.readOnly = false;
	$scope.dataReceived = false;
	$scope.ui = {


	};
	$scope.obj = {
		name : null,
		surname : null,
		photo : null,
		blog : null,
		twitter : null,
		linkedin : null,
		github : null,
		bio : null
	};

	var saveIndex = 0;
	var manyToManyCount = 0;

	$scope.add = function () {
		$scope.uiWorking = true;
		$scope.obj._id = undefined;
		SpeakerService.add(dataToServer($scope.obj)).then(function (httpResponse) {
			if($scope.parent) {
				NavigationService.setReturnData({parent: $scope.parent, entity: httpResponse.data});
				$location.path(NavigationService.getReturnUrl());
			}
			else {
				gotoList();
			}
	    }, errorHandlerAdd, progressNotify);
	};
	
	$scope.update = function () {
		$scope.uiWorking = true;
		SpeakerService.update(dataToServer($scope.obj)).then(function () { //httpResponse
				returnBack();
			}, errorHandlerUpdate, progressNotify);
	};

	$scope.delete = function () {
		$scope.uiWorking = true;
		SpeakerService.delete($scope.obj._id).then(returnBack, errorHandlerDelete, progressNotify);
	};

	function progressNotify() { //update
	}

	function errorHandlerAdd(httpError) {
		$scope.uiWorking = false;
		$scope.dataReceived = true;
		$scope.errors = UserErrorService.translateErrors(httpError, "add");
	}

	function errorHandlerUpdate(httpError) {
		$scope.uiWorking = false;
		$scope.dataReceived = true;
		$scope.errors = UserErrorService.translateErrors(httpError, "update");
	}

	function errorHandlerDelete(httpError) {
		$scope.uiWorking = false;
		$scope.dataReceived = true;
		$scope.errors = UserErrorService.translateErrors(httpError, "delete");
	}

	function errorHandlerLoad(httpError) {
		$scope.uiWorking = false;
		$scope.dataReceived = true;
		$scope.errors = UserErrorService.translateErrors(httpError, "query");
	}

	function dataToServer(obj) {
	
		return obj;
	}		

	function loadData(httpResponse) {
		$scope.obj = httpResponse.data;


		$scope.canEdit = $scope.isView && EntityUtilService.hasActionCapability($scope.obj, 'edit');
		$scope.canDelete = $scope.isView && EntityUtilService.hasActionCapability($scope.obj, 'delete');
		$scope.errors = null;
		$scope.dataReceived = true;
	}
	function returnBack() {
		if ($scope.parent) {
			NavigationService.setReturnData({ parent: $scope.parent });
			$location.path(NavigationService.getReturnUrl());
		}
		else {
			gotoList();
		}
	}

	$scope.cancel = returnBack;

	$scope.gotoEdit = function() {
		$location.path('/speaker/edit/' + $routeParams.id);		
	};

	$scope.gotoDelete = function() {
		$location.path('/speaker/delete/' + $routeParams.id);		
	};


	function saveAllThenGotoList() {
		saveIndex++;
		if (saveIndex === manyToManyCount) {
			returnBack();
		}
	}


	function gotoList() {
		$scope.uiWorking = false;
		$location.path('/speaker/');		
	}

	$scope.submit = function() {
		if ($scope.isCreation && !$scope.editForm.$invalid) {
			$scope.add();
		}
		else if ($scope.isEdition && !$scope.editForm.$invalid) {
			$scope.update();
		}
		else if ($scope.isDeletion) {
			$scope.delete();
		}
	};


	function init() {
		$scope.isDeletion = isDeletionContext();
		$scope.isView     = isViewContext();
		$scope.readOnly   = $scope.isDeletion || $scope.isView;
		if ($routeParams.id) {
			$scope.isEdition = !$scope.readOnly;
			$scope.isCreation = false;
			setParent();
		}
		else {
			$scope.isEdition = false;
			$scope.isCreation = true;
			$scope.dataReceived = true;
			$scope.obj._id = 'new';
			setNavigationStatus();
		}


		if ($routeParams.id) {
			SpeakerService.getDocument($routeParams.id).then(loadData, errorHandlerLoad);		
		}

	}

	function isDeletionContext() {
		return stringContains($location.path(), '/delete/');
	}

	function isViewContext() {
		return stringContains($location.path(), '/view/');
	}

	
	function stringContains(text, substring) {
		return text.indexOf(substring) > -1;
	}
	function setParent() {
		var state = NavigationService.getState();
		$scope.parent = (state && state.parent) ? state.parent : null;
		return state;
	}


	function popNavItem() {
		var navItem = NavigationService.pop();
		setNavigationStatus();
		return navItem;
	}

	function setObj(obj) {
		$scope.obj = obj;
		if($scope.editForm) {
			$scope.editForm.$dirty = true;
		}

		if ($routeParams.id && !$scope.obj) {
			SpeakerService.getDocument($routeParams.id).then(loadData, errorHandlerLoad);
		}

	}


	function setNavigationStatus() {

		setParent();

	}

	init();
}]);
