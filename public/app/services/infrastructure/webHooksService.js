angular.module('myApp').service('WebHooksService', ['$http', '$q', 'MetadataService', function ($http, $q, MetadataService) {

	var WebHooksService = {};
	var resourceUrl = '/api/webhook';


	// Function wrapper verifying URL is available before any API call.
	var safeCall = function (functionToCall) {
		return function () {
			var args = Array.prototype.slice.call(arguments);
			var deferred = $q.defer();
			deferred.resolve(functionToCall.apply(this, args));
			return deferred.promise;
		};
	};

	function buildBaucisQuery(opts) {
		var q ='?';
		var prefix='';
		if (opts.page === null && opts.blockSize === null) {			
			opts.page = opts.page || 1;
			opts.pageSize = opts.pageSize || 20;
		}
		else {
			opts.page = opts.page || 1;
			opts.pageSize = opts.pageSize || 20;
			
			var skip =  (opts.page-1)*opts.pageSize;
			if(skip > 0) {
				q += prefix + 'skip=' + skip;
				prefix='&';			
			}
			q += prefix + '&limit=' + opts.pageSize;
			prefix='&';
		}
		if (opts.sort) {
			q += prefix + 'sort=' + encodeURIComponent(opts.sort) + '';
			prefix='&';
		}			
		if (opts.criteria) {
			q += prefix + 'conditions={' + encodeURIComponent(opts.criteria) + '}';
			prefix='&';
		}
		if (opts.select) {
			q += prefix + 'select={' + encodeURIComponent(opts.select) + '}';
			prefix='&';
		}
		if (opts.populate) {
			q += prefix + 'populate={' + encodeURIComponent(opts.populate) + '}';
			prefix='&';
		}
		if (opts.hint) {
			q += prefix + 'hint={' + encodeURIComponent(opts.hint) + '}';
			prefix='&';
		}
		if (opts.count === true) {
			q += prefix + 'count=true';
			prefix='&';
		}
		if (opts.searchText && opts.searchText!=='') {
			//Do a custom like query
			var likeQuery = buildLikeQuery(opts.searchText);   
			q += prefix + 'conditions={' + encodeURIComponent(likeQuery) + '}';
			prefix='&';
		}
		return q;
	}

	function buildLikeQuery(searchText) {
		var res='"$or":[';
		//add string fields
		var clauses = [];
		var clause = null;

		//Process each property
		clause = addStringLike('resource', searchText);
		if (clause) {
			clauses.push(clause);
		}
		clause = addStringLike('operation', searchText);
		if (clause) {
			clauses.push(clause);
		}
		clause = addStringLike('httpMethod', searchText);
		if (clause) {
			clauses.push(clause);
		}
		clause = addStringLike('uriTemplate', searchText);
		if (clause) {
			clauses.push(clause);
		}

		var prefix='';
		clauses.forEach(function(item) {
			res+=prefix+item;
			prefix=',';
		});
		res += ']';

		if (clauses.length>0) {
			return res;
		}

		return '';
	}

	function addStringLike(property, searchValue) {
		if (searchValue === null) {
			return null;
		}
		return '{"'+ property +'":{"$regex":"' + escapeForRegex(searchValue) + '","$options":"i"}}';
	}
	
	
	function escapeForRegex(candidate) {
		//escape values for regex
		return candidate;
	}
	

	

	//-- Public API -----

	WebHooksService.getCount =  safeCall(function (opts) {
		opts = opts || {};
		opts.count = true;		
		var q = buildBaucisQuery(opts);
		return $http.get(resourceUrl + q);
	});
	
	WebHooksService.getList = safeCall(function (opts) {
		opts = opts || {};
		var q = buildBaucisQuery(opts);
		return $http.get(resourceUrl + q);
	});

	WebHooksService.getListAsCsv = safeCall(function () {
		return $http({
			method: 'GET', 
			url: resourceUrl, 
			headers: {'Accept': 'text/csv'} 
		});
	});	

	WebHooksService.getFileAsCsv = safeCall(function () {
		return $http({
			method: 'GET', 
			url: resourceUrl + '/download/csv/', 
			headers: {'Accept': 'text/csv'} 
		});
	});	
	WebHooksService.getFileAsXml = safeCall(function () {
		return $http({
			method: 'GET', 
			url: resourceUrl + '/download/xml/', 
			headers: {'Accept': 'text/xml'} 
		});
	});		
	WebHooksService.getFileAsXlsx = safeCall(function () {
		return $http({
			method: 'GET', 
			url: resourceUrl + '/download/xlsx/', 
			headers: {'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
			responseType: 'blob' 
		});
	});		
	
	WebHooksService.getToEdit = safeCall(function (id) {
		return $http.get(resourceUrl + '/' + id );
	});

	WebHooksService.get = safeCall(function (link) {
		return $http.get(link);
	});

	WebHooksService.add = safeCall(function (item) {
		return $http.post(resourceUrl, JSON.stringify(item));
	});

	WebHooksService.update = function (item) {
		return $http.put(resourceUrl + '/' + item._id, JSON.stringify(item));
	};

	WebHooksService.delete = safeCall(function (item) {
		return $http.delete(resourceUrl + '/' + item._id);
	});
	
	WebHooksService.saveHooks = safeCall(function (hooks) {
		var payload = {
			'items': hooks
		};
		return $http.post(resourceUrl, JSON.stringify(payload));
	});	


	MetadataService.getClasses().then(function(classes) {
		WebHooksService.resources = classes;
	});

	WebHooksService.getResources = function () {
		return MetadataService.getClasses();
	};

	WebHooksService.operations=[{
		key: 'Add',
		value: 'Add'
	},{
		key: 'Modify',
		value: 'Modify'
	},{
		key: 'Delete',
		value: 'Delete'
	},{
		key: 'Query',
		value: 'Query'
	},{
		key: '*',
		value: '* (all)'
	}];

	WebHooksService.httpMethods=[{
		key: 'GET',
		value: 'GET'
	},{
		key: 'POST',
		value: 'POST'
	},{
		key: 'PUT',
		value: 'PUT'
	},{
		key: 'DELETE',
		value: 'DELETE'
	}];

	WebHooksService.httpParameterTypes = [{
		key: 'cookie',
		value: 'Cookie'
	},{
		key: 'header',
		value: 'HTTP header'
	},{
		key: 'basicAuth',
		value: 'Basic Authorization'
	}];

	WebHooksService.contentTypes = [{
		key: 'application/json',
		value: 'application/json'
	},{
		key: 'application/x-www-form-urlencoded',
		value: 'application/x-www-form-urlencoded'
	},{
		key: 'application/xml',
		value: 'application/xml'
	},{
		key: 'text/plain',
		value: 'text/plain'
	}];

	WebHooksService.hookTemplates = [{
		key: null,
		label: 'User Defined',
		description: 'User Defined Template',
		method: null,
		urlTemplate: null,
		parameters: [],
		contentType: null,
		bodyTemplate: null
	},{
		key: 'slack.com#inbound',
		label: 'slack.com',
		description: 'Integrate with slack.com real-time messaging platform.',
		method: 'POST',
		urlTemplate: 'https://hooks.slack.com/services/{userCode}/{roomCode}/{secret}',
		parameters: [{
			type: 'header',
			key: 'User-Agent',
			value: 'Acme'
		}],
		contentType: 'application/json',
		bodyTemplate: '{\n\t"text": "{text}",\n\t"username": "{username}"\n\t"icon_url": "{url}"\n}\n'
	},{		
		key: 'iftt.com#maker',
		label: 'iftt.com Channel: Maker',
		description: 'ifftt.com Maker allows to easily integrate with many IoT devices.',
		method: 'POST',
		urlTemplate: 'https://maker.ifttt.com/trigger/{eventName}/with/key/{secretKey}',
		parameters: [],
		contentType: 'application/json',
		bodyTemplate: '{\n\t"value1": "{v1}",\n\t"value2": {v2},\n\t"value3": "{v3}"\n}\n'
	}];

	return WebHooksService;

}]);
