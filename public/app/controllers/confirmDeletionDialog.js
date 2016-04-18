angular.module('myApp').controller('ConfirmDeletionDialogController', ['$scope', '$translate', '$modalInstance', 'data', function ($scope,  $translate, $modalInstance, data) {
	
	$scope.data = data;
	
	$scope.confirm = function() {
		$modalInstance.close(true);
	};
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};

}]);