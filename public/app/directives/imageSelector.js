var imageSelectorController = function ($scope, $timeout) {
	$scope.property = null;

	$scope.canAddImage = true;
	$scope.showImage = true;
	$scope.showCurrent = true;
	$scope.showPreview = false;
	
	$scope.delete = function() {
		$scope.property = null;
		$scope.inputControl.value = '';		
	};
		
	$scope.previewImage = function(file) {
		if (!isFile(file)) {
			return;
		}
		//Load and preview image
		var fileReader = new FileReader();
		fileReader.readAsDataURL(file);
		fileReader.onload = function (e) {
			$timeout(function () {
				$scope.elem.find('img#previewImg').attr('src', e.target.result);
				$scope.showCurrent = false;
				$scope.showPreview = true;		
			});
		};
	};
	
	function isFile(item) {
		if (!item) {
			return false;
		}
		if (item.constructor && item.constructor.name === 'File') {
			return true;
		}
		//duck typing for Safari. Cuack, cuack!
		if (item.type && item.name && item.lastModified && item.size) {
			return true;
		}
		return false;
	}
};
imageSelectorController.$inject = ['$scope', '$timeout'];

angular.module('myApp').directive("imageSelector", [function () {
	
	var uniqueId = 0;
	
	return {
		controller: imageSelectorController,
		restrict: 'E',
		replace: true,
		scope: {
			id:		  "@",
			property: "=ngModel",
			readonly: "=readonly",
			required : "=ngRequired",
			width:    "@",
			height:   "@",
			options:  "@"
		},
		templateUrl: '/app/directives/imageSelector.html',

		link: function (scope, elem, attr) {
			
			var idInput;
			if (elem.attr('id') == null) {
				scope.id = 'imageSelector' + uniqueId++;
				idInput = 'input' + scope.id;
				elem.find('input').attr('id', idInput);
			} else {
				scope.id = elem.attr('id');
				idInput = scope.id;
			}
			scope.elem = elem;
			scope.inputControl = elem.find('img#currentImg')[0];
			scope.previewControl = elem.find('img#previewImg')[0];
			
			if (scope.width) {	
				elem.find('img#currentImg').attr('width', scope.width);	
				elem.find('img#previewImg').attr('width', scope.width);	
			}
			if (scope.height) {	
				elem.find('img#currentImg').attr('height', scope.height);	
				elem.find('img#previewImg').attr('height', scope.height);	
			}
			
			elem.find('input').bind("change", function (changeEvent) {
				scope.$apply(function () {
					scope.property = changeEvent.target.files[0];
					scope.previewImage(scope.property);
				});
			});

			scope.showImage = true;
			scope.canAddImage = !scope.readonly;
			scope.canDeleteImage = !scope.readonly;
			
		}
	};
}]);