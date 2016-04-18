angular.module('myApp').service('ConfigService', ['$http', '$q', 'baseApi', function ($http, $q, baseApi) {

	var ConfigService = {};

	var resourceUrl = '/api/admin-config';

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
		clause = addStringLike('key', searchText);
		if (clause !== null) {
			clauses.push(clause);
		}
		clause = addStringLike('value', searchText);
		if (clause !== null) {
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
	function buildMongooseQuery(opts) {
		var q = '';
		if (opts.searchText && opts.searchText!=='') {
			var likeQuery = buildMoongooseLikeQuery(opts.searchText);   
			q = '{' + likeQuery + '}';			
		}
		return q;
	}

	function buildMoongooseLikeQuery(searchText) {
		var res='"$or":[';
		//add string fields
		var clauses = [];
		var clause = null;

		//Process each property
		clause = addStringLike('key', searchText);
		if (clause !== null) {
			clauses.push(clause);
		}
		clause = addStringLike('value', searchText);
		if (clause !== null) {
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


	//-- Public API -----

	ConfigService.getCount =  function (opts) {
		opts = opts || {};
		opts.count = true;		
		var q = buildBaucisQuery(opts);
		return $http.get(resourceUrl + q);
	};
	
	ConfigService.getList = function (opts) {
		opts = opts || {};
		var q = buildBaucisQuery(opts);
		return $http.get(resourceUrl + q);
	};

	ConfigService.getListAsCsv = function () {
		return $http({
			method: 'GET', 
			url: resourceUrl, 
			headers: {'Accept': 'text/csv'} 
		});
	};	

	ConfigService.getFileAsCsv = function () {
		return $http({
			method: 'GET', 
			url: resourceUrl + '/download/csv/', 
			headers: {'Accept': 'text/csv'} 
		});
	};	
	ConfigService.getFileAsXml = function () {
		return $http({
			method: 'GET', 
			url: resourceUrl + '/download/xml/', 
			headers: {'Accept': 'text/xml'} 
		});
	};		
	ConfigService.getFileAsXlsx = function () {
		return $http({
			method: 'GET', 
			url: resourceUrl + '/download/xlsx/', 
			headers: {'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
			responseType: 'blob' 
		});
	};		
	
	ConfigService.getToEdit = function (id) {
		return $http.get(resourceUrl + '/' + id );
	};

	ConfigService.get = function (link) {
		return $http.get(link);
	};

	ConfigService.add = function (item) {
		return $http.post(resourceUrl, JSON.stringify(item));
	};

	ConfigService.update = function (item) {
		return $http.put(resourceUrl + '/' + item._id, JSON.stringify(item));
	};

	ConfigService.delete = function (id) {
		return $http.delete(resourceUrl + '/' + id);
	};

	ConfigService.deleteMany = function (ids) {
		var msg = { 
			'className' : 'admin_config',
			'ids'		: ids
		};	
		return $http.post(baseApi + '/delete', JSON.stringify(msg));
	};	

	ConfigService.deleteAll = function (opts) {
		var msg = { 
			'className' : 'admin_config',
			'conditions' : buildMongooseQuery(opts)
		};	
		return $http.post(baseApi + '/deleteAll', JSON.stringify(msg));
	};	

	ConfigService.setKey = function (key, value) {
		var item = {
			'key': key,
			'value': value
		};
		return $http.post('/api/setConfigKey', JSON.stringify(item));
	};

	ConfigService.getByKey = function (configKey) {
		var q = buildBaucisQuery({
			'searchText': configKey
		});
		return $http.get(resourceUrl + q);		
	};


	return ConfigService;

}]);
