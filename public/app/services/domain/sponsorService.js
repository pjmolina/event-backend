angular.module('myApp').service('SponsorService', ['$http', '$q', 'baseApi', 'QueryBuilderService', 'EntityUtilService', function ($http, $q, baseApi, QueryBuilderService, EntityUtilService) {

	var SponsorService = {};

	var resourceUrl = baseApi + '/sponsors';
	var fields = null;

	function buildFields() {
		if (!fields) {
			fields = [
				{name: 'name', type: 'string'},
				{name: 'level', type: 'string'},
				{name: 'logo', type: 'image'}
			];
		}
		return fields;
	}

	function getDisplayLabel(sponsor) {
		return sponsor.name;
	}
	SponsorService.getDisplayLabel = getDisplayLabel;

	//-- Public API -----

	SponsorService.getCount =  function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		opts.count = true;		
		return QueryBuilderService.buildBaucisQuery(opts).then(function(q) {
			return $http.get(resourceUrl + q);
		}, function (err) {
			return $q.reject(err);
		});
	};
	
	SponsorService.getList = function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		return QueryBuilderService.buildBaucisQuery(opts).then(function(q) {
			return $http.get(resourceUrl + q).then(function(response) {
				response.data.forEach(function(element) {
					element._displayLabel = getDisplayLabel(element);
				});
				return response;
			}, function (err) {
				return $q.reject(err);
			});
		}, function (err) {
			return $q.reject(err);
		});
	};

	function exportQuery(opts) {
		opts = opts || {};
		opts.paginate = false;
		opts.fields = opts.fields || buildFields();
		return QueryBuilderService.buildBaucisQuery(opts).then(function (q) {
		    return q;
		}, function (err) {
		    return $q.reject(err);
		});
	}

	SponsorService.getListAsCsv = function (opts) {
		return exportQuery(opts).then(function (q) {
			return $http({
				method: 'GET', 
				url: resourceUrl + q, 
				headers: {'Accept': 'text/csv'} 
			});
		}, function (err) {
			return $q.reject(err);
		});
	};	

	SponsorService.getFileAsCsv = function (opts) {
		return exportQuery(opts).then(function (q) {
			return $http({
				method: 'GET', 
				url: resourceUrl + q, 
				headers: {'Accept': 'text/csv'} 
			});
		}, function (err) {
			return $q.reject(err);
		});
	};	
	SponsorService.getFileAsXml = function (opts) {
		return exportQuery(opts).then(function (q) {
			return $http({
				method: 'GET', 
				url: resourceUrl + q, 
				headers: {'Accept': 'text/xml'} 
			});
		}, function (err) {
			return $q.reject(err);
		});
	};		
	SponsorService.getFileAsXlsx = function (opts) {
		return exportQuery(opts).then(function (q) {
			return $http({
				method: 'GET', 
				url: resourceUrl + q, 
				headers: {'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
				responseType: 'blob' 
			});
		}, function (err) {
			return $q.reject(err);
		});
	};		
	
	SponsorService.get = function (link) {
		return $http.get(link);
	};
	
	SponsorService.getDocument = function (id) {
		return SponsorService.get(resourceUrl + '/' + id ).then(function(response) {
			response.data._displayLabel = getDisplayLabel(response.data);
			return response;
		}, function (err) {
			return $q.reject(err);
		});
	};

	SponsorService.add = function (item) {
		//Multipart/form-data to support files attached
		var multipartMessage = EntityUtilService.buildMultipartMessage('data', item);
		return $http.post(resourceUrl, multipartMessage, {
			headers: { 'Content-Type': undefined },
			transformRequest: angular.identity
		});
	};

	SponsorService.update = function (item) {
		//Multipart/form-data to support files attached
		var q = resourceUrl + '/' + item._id;
		var multipartMessage = EntityUtilService.buildMultipartMessage('data', item);
		return $http.put(q, multipartMessage, {
			headers: { 'Content-Type': undefined },
			transformRequest: angular.identity
		});		
	};

	SponsorService.delete = function (id) {
		return $http.delete(resourceUrl + '/' + id);
	};

	SponsorService.deleteMany = function (ids) {
		return $http.post(resourceUrl + '/deleteByIds', JSON.stringify(ids));
	};	

	SponsorService.deleteByQuery = function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		opts.paginate = false;		
		return QueryBuilderService.buildBaucisQuery(opts).then(function (q) {
			return $http.delete(resourceUrl + q);
		}, function (err) {
			return $q.reject(err);
		});
	};

	return SponsorService;

}]);
