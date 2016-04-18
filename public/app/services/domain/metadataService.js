angular.module('myApp').service('MetadataService', ['$http', '$q', 'baseApi', function ($http, $q, baseApi) {
	var MetadataService = {};
	var resourceUrl = baseApi + '/metadata';
	
	var cachedMetadata = null; 

	function getMetadata() {
		var deferred = $q.defer();
		
		if (cachedMetadata) {
			deferred.resolve(cachedMetadata);
		}		
		else {
			$http.get(resourceUrl).then(
				function(httpData) {
					cachedMetadata = httpData.data;
					deferred.resolve(cachedMetadata);
				});
		}
		return deferred.promise;	
	}
	
	MetadataService.getRootClasses = function() {
		var deferred = $q.defer();

		getMetadata().then(function() {
			deferred.resolve( filterRootClasses(cachedMetadata.metamodel) );
		});

		return deferred.promise;	
	};

	function filterRootClasses(model) {
		var res = [];
		for(var i=0; i< model.classes.length; i++) {
			var cl = model.classes[i];
			if (isRootClass(model, cl.name)) {
				res.push(cl);
			}		
		}
		return res;
	}

	function isRootClass(model, className) {
		return !isEmbededClass(model, className);
	}

	function isEmbededClass(model, className) {
		for (var i = 0; i < model.associations.length; i++) {
			var association = model.associations[i];
			if (association.composition && association.bClass.toLowerCase() === className.toLowerCase()) {
				return true;
			}
		}
		return false;
	}

	MetadataService.getClasses = function() {
		var deferred = $q.defer();

		getMetadata().then(function(data) {
			deferred.resolve( cachedMetadata.metamodel.classes );
		});

		return deferred.promise;	
	};
	
	MetadataService.getClass = function(clName) {
		var deferred = $q.defer();

		MetadataService.getClasses().then(function() {
			deferred.resolve( findClass(cachedMetadata.metamodel, clName) );
		});

		return deferred.promise;	
	};
	
	MetadataService.getPropertiesFor = function(clName) {
		var deferred = $q.defer();

		MetadataService.getClasses().then(function() {
			var cl = findClass(cachedMetadata.metamodel, clName);
			var result = cl ? cl.attributes :  null;
			deferred.resolve( result );
		});

		return deferred.promise;	
	};

	MetadataService.getOperationsFor = function(clName) {
		var deferred = $q.defer();

		MetadataService.getClasses().then(function() {
			var cl = findClass(cachedMetadata.metamodel, clName);
			var result = cl ? cl.operations :  null;
			deferred.resolve( result );
		});

		return deferred.promise;	
	};
	
	function findClass(model, clName) {
		var key = clName.toLowerCase();
		for(var i=0; i< model.classes.length; i++) {
			var cl = model.classes[i];
			var candidate = cl.name.toLowerCase();
			if (candidate === key) {
				return cl;
			}
		}
		return null;
	}

/*
	var metaData = {
		"place" 		: 	["name","location","address","city","zipCode","image"],
		"sessionTalk" 		: 	["sessionType","name","track","language","starts","ends","description"],
		"speaker" 		: 	["name","surname","photo","blog","twitter","linkedin","github","bio"],
		"sponsor" 		: 	["name","level","logo"]
	};

	MetadataService.getPropertiesFor = function (className) {
		return (metaData[className] || [] ).slice(0);
	};

	MetadataService.getResourceList = function() {
		return [{
			key: 'places',
			value: 'Places'	
		}, {
			key: 'sessionTalks',
			value: 'SessionTalks'	
		}, {
			key: 'speakers',
			value: 'Speakers'	
		}, {
			key: 'sponsors',
			value: 'Sponsors'	
		}];
	};
*/

	return MetadataService;

}]);

