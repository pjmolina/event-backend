angular.module('myApp').service('SpeakerService', ['$http', '$q', 'baseApi', 'QueryBuilderService', 'EntityUtilService', function ($http, $q, baseApi, QueryBuilderService, EntityUtilService) {

	var SpeakerService = {};

	var resourceUrl = baseApi + '/speakers';
	var fields = null;

	function buildFields() {
		if (!fields) {
			fields = [
				{name: 'name', type: 'string'},
				{name: 'surname', type: 'string'},
				{name: 'photo', type: 'image'},
				{name: 'blog', type: 'string'},
				{name: 'twitter', type: 'string'},
				{name: 'linkedin', type: 'string'},
				{name: 'github', type: 'string'},
				{name: 'bio', type: 'string'}
			];
		}
		return fields;
	}

	function getDisplayLabel(speaker) {
		return speaker.name;
	}
	SpeakerService.getDisplayLabel = getDisplayLabel;

	//-- Public API -----

	SpeakerService.getCount =  function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		opts.count = true;		
		return QueryBuilderService.buildBaucisQuery(opts).then(function(q) {
			return $http.get(resourceUrl + q);
		}, function (err) {
			return $q.reject(err);
		});
	};
	
	SpeakerService.getList = function (opts) {
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

	SpeakerService.getListAsCsv = function (opts) {
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

	SpeakerService.getFileAsCsv = function (opts) {
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
	SpeakerService.getFileAsXml = function (opts) {
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
	SpeakerService.getFileAsXlsx = function (opts) {
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
	
	SpeakerService.get = function (link) {
		return $http.get(link);
	};
	
	SpeakerService.getDocument = function (id) {
		return SpeakerService.get(resourceUrl + '/' + id ).then(function(response) {
			response.data._displayLabel = getDisplayLabel(response.data);
			return response;
		}, function (err) {
			return $q.reject(err);
		});
	};

	SpeakerService.add = function (item) {
		//Multipart/form-data to support files attached
		var multipartMessage = EntityUtilService.buildMultipartMessage('data', item);
		return $http.post(resourceUrl, multipartMessage, {
			headers: { 'Content-Type': undefined },
			transformRequest: angular.identity
		});
	};

	SpeakerService.update = function (item) {
		//Multipart/form-data to support files attached
		var q = resourceUrl + '/' + item._id;
		var multipartMessage = EntityUtilService.buildMultipartMessage('data', item);
		return $http.put(q, multipartMessage, {
			headers: { 'Content-Type': undefined },
			transformRequest: angular.identity
		});		
	};

	SpeakerService.delete = function (id) {
		return $http.delete(resourceUrl + '/' + id);
	};

	SpeakerService.deleteMany = function (ids) {
		return $http.post(resourceUrl + '/deleteByIds', JSON.stringify(ids));
	};	

	SpeakerService.deleteByQuery = function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		opts.paginate = false;		
		return QueryBuilderService.buildBaucisQuery(opts).then(function (q) {
			return $http.delete(resourceUrl + q);
		}, function (err) {
			return $q.reject(err);
		});
	};
	SpeakerService.getSpeakerSession = function (id) {
		return SpeakerService.get(resourceUrl + '/' + id  + '/session');
	};
	
	SpeakerService.setSpeakerSession = function (id, sessionTalkIds) {
		return $http.put(resourceUrl + '/' + id  + '/session', JSON.stringify(sessionTalkIds));
	};

	return SpeakerService;

}]);
