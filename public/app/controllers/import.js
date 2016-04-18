angular.module('myApp').controller('ImportController', ['$scope', '$routeParams', '$location', '$translate', 'NavigationService', 'ImportService', function ($scope, $routeParams, $location, $translate, NavigationService, ImportService) {

	function init() {
		$scope.hasValidFile = false;		
		$scope.className = $routeParams.class;
		$scope.previewData = null;
		$scope.fileSelected = null;
		$scope.wizardStep = 0; //select file
		$scope.titleKey = "label.class.import." + $routeParams.class;
	}
	
	$scope.$watch('importFile', function(newValue, oldValue) {
		if (newValue == null || newValue==='') {
			return;
		}
		handleFile(newValue);
	});
	
	/*
	$scope.droppedFile = function (f) {		
		handleFile(newValue);
	};	
	*/

	function handleFile(file) {
		$scope.loadMessage = "Loading file: " + file.name +" ... Please wait.";
		ImportService.previewData(file, $scope.className)
		.then(function(data) {
			$scope.error = data.error; 
			if (!$scope.error) {
				$scope.wizardStep = 1; //select header
				$scope.previewData = data; 
				$scope.hasValidFile = true;
				$scope.currentWorkSheet = data.workSheets[0];
				
			} else {
				$scope.previewData = null;
				$scope.hasValidFile = false;
			}
			$scope.loadMessage = null;
		}, function(err) {
			$scope.error = err.error; 
			$scope.previewData = null;
			$scope.hasValidFile = false;
			$scope.loadMessage = null;
		});

	}
	
	$scope.gotoFileSelection = function () {
		$scope.importFile = null; //<-not working
		$scope.wizardStep = 0; //File selection
	};

	$scope.cancel = function () {
		//return back to referral url
		var navItem = NavigationService.pop();
		var url = navItem.url || '/'+$scope.className+'/list';
		$location.path(url);
	};
	
	$scope.back = function () {
		$scope.wizardStep -= 1;
	};
	
	$scope.importPreview = function () {
		$scope.wizardStep = 2; //import Preview
		//recalculate headers & data with current info
		ImportService.selectDataToImport($scope.previewData, $scope.className, $scope.currentWorkSheet)
			.then(function(data) {		
				$scope.previewData = data;
			});
	};
	
	$scope.import = function () {
		$scope.wizardStep = 3; //uploading
		
		ImportService.importData($scope.className, $scope.previewData, $scope.currentWorkSheet)
		.then(function(res) {
			$scope.importResult = res.data;
			$scope.wizardStep = 4; //imported
		},
		function(res) {
			//fail
			$scope.importResult = res.data;
			$scope.wizardStep = 4; //imported
		});					
	};

	$scope.sheetSelected = function(sheetName) {
		$scope.currentWorkSheet = sheetName;
		changeSelectedSheet();
	};

	$scope.selectNewHeader = function(sheet, index) {
		if (sheet == null) {
			return;
		}
		sheet.candidateHeaderLine = index;
		changeSelectedSheet();
	};
	
	
	function changeSelectedSheet() {
		$scope.changedHeader = true;
	}

	
	$scope.isBinded = function(header) {
		var col = $scope.previewData.foundProperties;
		if (col == null) {
			return false;
		}
		
		return col.indexOf(header) > -1;
	};
	
	init();
}]);