angular.module('myApp').controller('EditSessionTalkController', 
  ['$scope', '$routeParams', '$location', '$translate', '$timeout', 'UserErrorService', 'NavigationService', 'EntityUtilService', 'SecurityService', 'SessionTalkService', 'SpeakerService', 
  function($scope, $routeParams, $location, $translate, $timeout, UserErrorService, NavigationService, EntityUtilService, SecurityService, SessionTalkService, SpeakerService) {

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
		sessionType : null,
		name : null,
		track : null,
		language : null,
		starts : null,
		ends : null,
		description : null,
		actualSpeaker : {},
		enableSpeaker : true
	};

	var saveIndex = 0;
	var manyToManyCount = 0;

	$scope.add = function () {
		$scope.uiWorking = true;
		$scope.obj._id = undefined;
		SessionTalkService.add(dataToServer($scope.obj)).then(function (httpResponse) {
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
		SessionTalkService.update(dataToServer($scope.obj)).then(function () { //httpResponse
				returnBack();
			}, errorHandlerUpdate, progressNotify);
	};

	$scope.delete = function () {
		$scope.uiWorking = true;
		SessionTalkService.delete($scope.obj._id).then(returnBack, errorHandlerDelete, progressNotify);
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

	function loadSpeaker(httpResponse) {
		$scope.obj.actualSpeaker = httpResponse.data;
	}

	function loadData(httpResponse) {
		$scope.obj = httpResponse.data;

		$scope.obj.enableSpeaker = true;
		if($scope.obj.speaker) {
			SpeakerService.getDocument($scope.obj.speaker)
				.then(loadSpeaker, errorHandlerLoad);
		}


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
		$location.path('/sessionTalk/edit/' + $routeParams.id);		
	};

	$scope.gotoDelete = function() {
		$location.path('/sessionTalk/delete/' + $routeParams.id);		
	};


	function saveAllThenGotoList() {
		saveIndex++;
		if (saveIndex === manyToManyCount) {
			returnBack();
		}
	}


	function gotoList() {
		$scope.uiWorking = false;
		$location.path('/sessionTalk/');		
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

	$scope.selectSpeaker = function() {
		//save context
		NavigationService.push($location.path(), "SelectSpeaker", {parent: $scope.obj});
		$location.path('/speaker/select');
	};
	
	$scope.clearSpeaker = function() {

		$scope.obj.speaker = null;
		$scope.obj.actualSpeaker = null;
	};
	
	function selectSpeakerBack() {
		var navItem = popNavItem();
		if(navItem.returnData) {
			var sessionTalk = navItem.returnData.parent;
			if(sessionTalk) {
				setObj(sessionTalk);
				$scope.dataReceived = true;
				var speaker = navItem.returnData.entity;
				if(speaker){

					$scope.obj.speaker = speaker._id;
					$timeout(function() {
					  $scope.obj.actualSpeaker = speaker;
					}, 100);
				}
				return;
			}
		}

		SessionTalkService.getDocument($routeParams.id).then(loadData, errorHandlerLoad);

	}



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


		if (NavigationService.isReturnFrom('SelectSpeaker')) {
			selectSpeakerBack();
			return;
		}

		if ($routeParams.id) {
			SessionTalkService.getDocument($routeParams.id).then(loadData, errorHandlerLoad);		
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
			SessionTalkService.getDocument($routeParams.id).then(loadData, errorHandlerLoad);
		}

	}


	function setNavigationStatus() {

		var state = setParent();
		if ($scope.parent) {
			switch (state.parentClass) {
				case 'speaker':
					$scope.obj.actualSpeaker = state.parent;
					$scope.obj.speaker = (state.parent._id === 'new') ? undefined : state.parent._id;
					$scope.obj.enableSpeaker = false;
					break;

				default:
					break;
			}
		}

	}

	init();
}]);
