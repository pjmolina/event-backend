/*global angular*/
angular.module('myApp').controller('AdminWebHooksController', ['$scope', '$location', 'WebHooksService', 'ConfigService', 'UserErrorService', function ($scope, $location, WebHooksService, ConfigService, UserErrorService) {

	var EditorStatus = {
		addNew: 1,
		edit: 2
	};

	function init(){
		WebHooksService.getResources().then(function(classes){
			$scope.resources = classes;           
		});

		$scope.operations= WebHooksService.operations;
		$scope.httpMethods= WebHooksService.httpMethods;
		$scope.paramTypes = WebHooksService.httpParameterTypes;
		$scope.contentTypes = WebHooksService.contentTypes;
		$scope.hookTemplates = WebHooksService.hookTemplates;
		
		$scope.enableWebhooks = false;
		$scope.webhooks = [];
		$scope.newWebhook = {
			id: null,
			cid: null,
			enabled: true,
			resource: null,
			operation: null,
			httpMethod: null,
			urlTemplate: null,
			parameters: [],
			contentType: $scope.contentTypes[0].key,
			bodyTemplate: null 
		};
		$scope.hooksEditorStatus = EditorStatus.addNew;


		ConfigService.getByKey('webhooks.enable').then(function(response) {
			var res = response.data;
			if (res.length === 0) {
				$scope.enableWebhooks = false;
			}
			else {
				$scope.enableWebhooks = (res[0].value === 'true');
			}
		});

		WebHooksService.getList({}).then(function(response) {
			$scope.webhooks = response.data;
			for(var i in $scope.webhooks) {
				var hook = $scope.webhooks[i];
				hook.cid = i;
			}
		});

		$scope.isDirty = false;
	}


	$scope.enableWh = function(state) {
		$scope.enableWebhooks = state;
		ConfigService.setKey('webhooks.enable', $scope.enableWebhooks)
			.then(savedOk, errorHandler); 
	};
	
	function savedOk(data) {
		$scope.error = null;
	}
	function errorHandler(httpError) {		
		$scope.errors = UserErrorService.translateErrors(httpError, '');
	}

	$scope.canAddHook = function() {
		if ($scope.hooksEditorStatus != EditorStatus.addNew) {
			return false;
		}
		return hookIsValid($scope.newWebhook);
	};
	$scope.canEditHook = function() {
		if ($scope.hooksEditorStatus != EditorStatus.edit) {
			return false;
		}
		return hookIsValid($scope.newWebhook);
	};

	function hookIsValid(hook) {
		if (	hook && 
				hook.resource && 
				hook.operation && 
				hook.httpMethod && 
				hook.resource.name  && 
				hook.operation.key  && 
				hook.httpMethod.key  && 
                hook.urlTemplate 
        ){
            return true;   
        }
        return false;
	}


	$scope.addHook = function () {
		var nh = {
			enabled: $scope.newWebhook.enabled,
			resource: $scope.newWebhook.resource.name,
			operation: $scope.newWebhook.operation.key,
			httpMethod: $scope.newWebhook.httpMethod.key,
			urlTemplate: $scope.newWebhook.urlTemplate,
			parameters: $scope.newWebhook.parameters,
			contentType: ($scope.newWebhook.contentType) ? $scope.newWebhook.contentType.key : null,
			bodyTemplate: $scope.newWebhook.bodyTemplate
		};

		WebHooksService.add(nh)
			.then(function(httpResponse) {
				$scope.webhooks.push(httpResponse.data);
			    clearEditor();
			}, 
			errorHandler);
	};
		
	$scope.editHook = function () {
		var nh = {
			cid: $scope.newWebhook.cid,
			_id: $scope.newWebhook._id,
			enabled: $scope.newWebhook.enabled,
			resource: $scope.newWebhook.resource.name,
			operation: $scope.newWebhook.operation.key,
			httpMethod: $scope.newWebhook.httpMethod.key,
			urlTemplate: $scope.newWebhook.urlTemplate,
			parameters: $scope.newWebhook.parameters,
			contentType: ($scope.newWebhook.contentType) ? $scope.newWebhook.contentType.key : null,
			bodyTemplate: $scope.newWebhook.bodyTemplate
		};
		updateHook(nh);
	};
	
	function updateHook(hook) {
		WebHooksService.update(hook)
			.then(function(httpResponse) {
				var index = locateIndexByAttr($scope.webhooks, 'cid', hook.cid);
					if (index != -1) {
						//replace
						var updatedData = httpResponse.data;
						updatedData.cid = hook.cid;
						$scope.webhooks.splice(index, 1, updatedData);
					}
				clearEditor();
			}, 
			errorHandler);
	}

	$scope.cancelEditHook = function () {
		clearEditor();
	};

	$scope.startEditHook = function(wh){
		var newh = {
			cid: wh.cid,
			_id: wh._id,
			enabled: wh.enabled,
			resource: selectItemByName(WebHooksService.resources, wh.resource),
			operation: selectItemByKey(WebHooksService.operations, wh.operation),
			httpMethod: selectItemByKey(WebHooksService.httpMethods, wh.httpMethod),
			urlTemplate: wh.urlTemplate,
			parameters: wh.parameters,
			contentType: selectItemByKey(WebHooksService.contentTypes, wh.contentType),
			bodyTemplate: wh.bodyTemplate
		};
		$scope.newWebhook = newh;
		$scope.hooksEditorStatus = EditorStatus.edit;
	};

	function selectItemByName(collection, name) {
		for(var i in collection) {
			var item = collection[i];
			if (item.name === name) {
				return item;
			}
		}
		return null;
	}

	function selectItemByKey(collection, key) {
		for(var i in collection) {
			var item = collection[i];
			if (item.key === key) {
				return item;
			}
		}
		return null;
	}

	function clearEditor() {
		$scope.newWebhook.enabled = false;
		$scope.newWebhook.resource = null;
		$scope.newWebhook.operation = null;
		$scope.newWebhook.httpMethod = null;
		$scope.newWebhook.urlTemplate = null;
		$scope.newWebhook.parameters = [];
		$scope.newWebhook.contentType = $scope.contentTypes[0].key;
		$scope.newWebhook.bodyTemplate = null;
		
		$scope.hooksEditorStatus = EditorStatus.addNew;
	}

	$scope.deleteHook = function(hook, $event) {
		WebHooksService.delete(hook)
			.then(function (data) {
				removeByAttr($scope.webhooks, 'cid', hook.cid);	
				clearEditor();			
			}, 
			errorHandler);
	};

	function locateIndexByAttr(arr, attr, value) {
	    var i = 0;
	    while(i < arr.length) {
	    	var item = arr[i];
	    	if (item[attr] === value) {
	    		return i;
	    	}
	    	i++;
	    }
	    return -1;
	}

	function removeByAttr(arr, attr, value){
	    var i = arr.length;
	    while(i--){
	       if( arr[i] &&
	           arr[i].hasOwnProperty(attr) &&
	           (arguments.length > 2 && arr[i][attr] === value ) ) { 

	           arr.splice(i, 1);
	       }
	    }
	    return arr;
	}
	
	$scope.enableCurrentWh = function(hk, value) {
		hk.enabled = value;
	};

	$scope.gotoHome = function() {
		$location.path('/');
	};
	$scope.cancel = function() {
		init();
	};

	$scope.addParameter = function () {
		var param = {
			type : 'header',
			key : '',
			value: null
		};
		if ($scope.newWebhook) {
			$scope.newWebhook.parameters.push(param);
		}
	};
	$scope.removeParameter = function (param) {
		if (!$scope.newWebhook) {
			return;
		}
		for(var i=0; i < $scope.newWebhook.parameters.length; i++) {
			if ($scope.newWebhook.parameters[i] === param) {
				$scope.newWebhook.parameters.splice(i, 1);
				return;
			}
		}
	};	
	
	$scope.addBodyTemplate = function (){
		var contentType = $scope.newWebhook.contentType.key;
		//var resource = $scope.newWebhook.resource;
		//var urlTemplate = $scope.newWebhook.urlTemplate;
		
		if (contentType === 'application/json') {
			$scope.newWebhook.bodyTemplate = '{\n    "par1": "value",\n    "par2": 3.14,\n    "par3": true,\n    "par4": null\n}';
		}
		else if (contentType === 'application/x-www-form-urlencoded') {
			$scope.newWebhook.bodyTemplate = 'par1="value"&par2=3.14&par3=true&par4=null';
		}
		else if (contentType === 'application/xml') {
			$scope.newWebhook.bodyTemplate = '<?xml version="1.0" encoding="utf-8"?>\n  <par1>value</par1>\n  <par2>3.14</par2>\n  <par3>true</par3>\n  <par4 xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>\n</xml>\n';
		}
		else if (contentType === 'text/plain') {
			$scope.newWebhook.bodyTemplate = 'par1: "value"\npar2: 3.14\npar3: true\npar4: null\n';
		}
	};

	$scope.hookTemplateSelected = function() {
		var tpl = $scope.newWebhook.template;
		if (!tpl || !tpl.key) {
			return;
		}
		if (tpl.method) {
			$scope.newWebhook.httpMethod = selectItemByKey(WebHooksService.httpMethods, tpl.method);
		}
		$scope.newWebhook.urlTemplate = tpl.urlTemplate || '';
		$scope.newWebhook.parameters=[];
		if (tpl.parameters) {
			for(var i=0; i<tpl.parameters.length; i++) {
				var param = tpl.parameters[i];
				var newParam  = {};
				angular.copy(param, newParam);
				$scope.newWebhook.parameters.push(newParam);
			}
		}
		if (tpl.contentType) {
			$scope.newWebhook.contentType = selectItemByKey(WebHooksService.contentTypes, tpl.contentType);			
		}
		$scope.newWebhook.bodyTemplate = tpl.bodyTemplate || '';
	};

	init();
}]);
