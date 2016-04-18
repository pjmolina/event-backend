angular.module('myApp').controller('AdminUsersController', 
  ['$scope', '$location', 'WebHooksService', 'UsersService', 'ProvidersService', 'PermissionsService', 
  function ($scope, $location, WebHooksService, UsersService, ProvidersService, PermissionsService) {

	var cidSeq = 4;

	var EditorStatus = {
		none: 0,
		addNew: 1,
		edit: 2
	};
	
	$scope.tab = 'Users';
	$scope.roles = [];

	function init() {
		loadData();
	}

	function loadData() {
		$scope.currentAccount = null;	
		$scope.isDirty = false;	
		$scope.editorStatus = EditorStatus.none;

		PermissionsService.getAllRoles().then(function(roles) {
			$scope.roles = roles;
			UsersService.getList().then(loadAccounts);
			ProvidersService.getList(true).then(loadProviders);
		});
	}

	function loadAccounts(response) {
		$scope.accounts = response.data;
	}
	function loadProviders(providers) {
		$scope.providers = providers;
		$scope.missingConfig = false;
		for (var i = 0; i < providers.length; i++) {
			if (!providers[i].configured) {
				$scope.missingConfig = true;
				break;
			}
		}
		$scope.providersWithLocal = [{ name: 'Local' }];
		$scope.providersWithLocal = $scope.providersWithLocal.concat($scope.providers);
	}

	$scope.selectTab = function(tab) {
		$scope.tab = tab;
	};
	$scope.changePassword = function() {
		$scope.showChangePasswordButton = false;
		$scope.canChangePassword = false;
		$scope.canUndoChangePassword = true;
		$scope.canTypePassword = true;
	};
	$scope.undoChangePassword = function() {
		$scope.showChangePasswordButton = true;
		$scope.canChangePassword = true;
		$scope.canUndoChangePassword = false;
		$scope.canTypePassword = false;
	};
	$scope.isAdding = function() {
		return $scope.editorStatus === EditorStatus.addNew;
	};
	$scope.isEditing = function() {
		return $scope.editorStatus === EditorStatus.edit;
	};
	$scope.isNone = function() {
		return $scope.editorStatus === EditorStatus.none;
	};
	$scope.showDetail = function(account) {
		$scope.currentAccount = account; 
		$scope.isDirty = false;
		$scope.editorStatus = EditorStatus.none;

		$scope.showChangePasswordButton = true;
		$scope.canChangePassword = true;
		$scope.canUndoChangePassword = false;
		$scope.canTypePassword = false;
	};
	$scope.newUser = function() {
		$scope.currentAccount = {
			cid: cidSeq++,
			_id: null,
			accountType: 'Local',
			username: null,
			newPassword: UsersService.getRandomPass(26),
			role: 'Admin',
			createdAt: null,
			lastAccessOn: null,
			description: null,
			enabled: true
		}; 
		$scope.editorStatus = EditorStatus.addNew;
		$scope.isDirty = true;

		$scope.showChangePasswordButton = false;
		$scope.canChangePassword = true;
		$scope.canUndoChangePassword = false;
		$scope.canTypePassword = true;
	};
	
	$scope.setDirty = function() {
		$scope.isDirty = true;
	};

	$scope.updateUser = function(account) {
		if (account._id == null) {
			account.createdAt = new Date();
			account.password = account.newPassword;

			UsersService.add(account)
			              .then(loadData);
		} else {
			//update
			if ($scope.canTypePassword) {
				account.password = account.newPassword;
			}
			UsersService.update(account)
			              .then(loadData);
		}		
	};

	$scope.deleteUser = function(account) {
		UsersService.delete(account._id)
		              .then(loadData);
	};

	$scope.setEnable = function() { //account, enable
		$scope.isDirty = true;
	};
	$scope.newPassword = function(account) {
		account.newPassword = UsersService.getRandomPass(26);
		$scope.isDirty = true;
	};
	$scope.cancelEdit = function() {
		$scope.isDirty = false;
		$scope.editorStatus = EditorStatus.none;
		$scope.currentAccount = null;
	};

	$scope.updateProvider = function (provider) {
		if (!provider.enable) {
			provider.autoEnroll = false;
		}

		ProvidersService.update(provider);
	};

	$scope.dragControlListeners = {
		accept: function () { //sourceItemHandleScope, destSortableScope 
			return true; 
		},
		orderChanged: function () { //event
			for (var i = 0; i < $scope.providers.length; i++) {
				var provider = $scope.providers[i];
				provider.order = i + 1;
				ProvidersService.update(provider);
			}
		}
	};

	init();

}]);
