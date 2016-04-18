angular.module('myApp').service('QueryBuilderService', ['$q', 'GeocodeService', function ($q, GeocodeService) {

    function buildBaucisQuery(opts) {
        var deferred = $q.defer();

		opts = opts || {};
		var q ='';
		var prefix='';

		if (opts.paginate === undefined) {
			opts.paginate = true;
		}
		if (opts.count) {
			opts.paginate = false;
		}
				
		if (opts.paginate) {	
			opts.page = opts.page || 1;
			opts.pageSize = opts.pageSize || 20;
			
			var skip =  (opts.page-1)*opts.pageSize;
			if(skip > 0) {
				q += prefix + 'skip=' + skip;
				prefix='&';			
			}
			q += prefix + 'limit=' + opts.pageSize;
			prefix='&';
		}
		if (opts.sort) {
			var sortQuery = buildSort(opts.sort);
			if (sortQuery) {
				q += prefix + 'sort=' + encodeURIComponent(sortQuery);
				prefix='&';				
			}
		}			
		if (opts.select) {
			q += prefix + 'select=' + encodeURIComponent(opts.select);
			prefix='&';
		}
		if (opts.populate) {
			q += prefix + 'populate=' + encodeURIComponent(opts.populate);
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

		if (opts.searchText && opts.searchText !== '') {
			//Do a custom like query
			buildLikeQuery(opts).then(function (likeQuery) {
				if (likeQuery) {
					if (opts.criteria) {
						q += prefix + 'conditions={"$and":[' + encodeURIComponent(opts.criteria) + ',' + encodeURIComponent(likeQuery) + ']}';
					}
					else {
						q += prefix + 'conditions=' + encodeURIComponent(likeQuery);
					}
				}
				else if (opts.criteria) {
					q += prefix + 'conditions=' + encodeURIComponent(opts.criteria);
				}
				q = q ? ('?' + q) : '';
				deferred.resolve(q);
			}, function (err) {
				return deferred.reject(err);
			});
		}
		else {
			if (opts.criteria) {
				q += prefix + 'conditions=' + encodeURIComponent(opts.criteria);
			}
			q = q ? ('?' + q) : '';
			deferred.resolve(q);
		}
        
		return deferred.promise;
	}

	function uriEncode(data) {
		return 	encodeURIComponent(data);
	}
	function uriDecode(data) {
		return 	decodeURIComponent(data);
	}

	function buildSort(sort) {
		var res = '';
		var prefix = '';
		for(var key in sort) {
			var value = sort[key];
			if (value === true) {
				res += prefix + key; //ASC
				prefix = ' ';
			}
			else if (value === false) {
				res += prefix + '-' + key; //DESC
				prefix = ' ';
			}
			else {
				//None
			}
		}
		return res;
	}

	function filterNulls(collection) {
		var col = collection.filter(function(item) {
			if (item !== null) {
				return item;
			}
		});
		return col;
	}

	function andBuild(clauseArray) {
		var col = filterNulls(clauseArray);
		if (col.length === 0) {
			return null;
		}
		if (col.length === 1) {
			return col[0];
		}
		var res = '{"$and":[';
		var prefix ='';
		for(var i=0; i<col.length; i++) {
			var item = col[i];
			res += prefix + item;
			prefix =',';
		}
		res += ']}';
		return res;
	}
	function orBuild(clauseArray) {
		var col = filterNulls(clauseArray);
		if (col.length === 0) {
			return null;
		}
		if (col.length === 1) {
			return col[0];
		}
		var res = '{"$or":[';
		var prefix ='';
		for(var i=0; i<col.length; i++) {
			var item = col[i];
			res += prefix + item;
			prefix =',';
		}
		res += ']}';
		return res;
	}

	function buildStringExactMatch(propName, value) {
		return '{"'+ propName +'":"'+ value +'"}';
	}
	function buildExactMatch(propName, value) {
		return '{"'+ propName +'":'+ value +'}';
	}

	function buildStringLike(property, searchValue) {
		if (searchValue === null){
			return null;
		}
		return '{"'+ property +'":{"$regex":"' + escapeForRegex(searchValue) + '","$options":"i"}}';
	}
	function buildNumberEquals(property, searchValue) {
		if (!isNumber(searchValue)) {
			return null;
		}
		var num = Number(searchValue);
		return '{"'+ property +'":' +  num + '}';
	}
	function buildBooleanEquals(property, searchValue) {
		var boolValue = strToBool(searchValue);
		if (boolValue === null) {
			return null;
		}
		return '{"'+ property +'":' +  boolValue + '}';			
	}
	
	function buildPointNear(property, searchValue) {
	    var deferred = $q.defer();

		var parts = searchValue.match(/^\[(\-?\d*(\.\d*)?)\s*,\s*(\-?\d*(\.\d*)?)\]$/);
		if (parts) {
			deferred.resolve(buildNearExpression(property, parts[1], parts[3]));
		}
		else {
			GeocodeService.getGeoFromAddress(searchValue)
				.then(function(loc) {
					if (loc && loc.data && loc.data.results && loc.data.results.length>0) {
						var lat  = loc.data.results[0].geometry.location.lat;
						var lng = loc.data.results[0].geometry.location.lng;
						deferred.resolve(buildNearExpression(property, lat, lng));
					}
				}, function(err) {
					deferred.reject(err);
				});
		}
		return deferred.promise;
	}

	function buildNearExpression(property, lat, lng, maxDistanceMeters, minDistanceMeters) {
		var exp = '{"' + property + '":{"$near":{' + buildGeometry(lat,lng);
		if (maxDistanceMeters) {
			exp += ',"$maxDistance:"' + maxDistanceMeters;
		}
		if (minDistanceMeters) {
			exp += '",$minDistance:"' + minDistanceMeters;			
		}
		exp += '}}}';
		return exp;
	}
	function buildGeometry(lat, lng) {
		return '"$geometry":{"type":"Point","coordinates":['+ lng +','+ lat +']}';
	}
	
	function buildDateTimeInRange(property, searchValue) {
		var dateTime; 
		if (isDate(searchValue)) {
			dateTime = toDate(searchValue);
		} else {
			dateTime = toDateTime(searchValue);			
		}

		if (!dateTime) {
			return null;
		}
		var offset = 0;
		if (dateTime.getMilliseconds() !== 0) {
			offset = 1; //1 ms
		}
		else if (dateTime.getSeconds() !== 0) {
			offset = 1000; //1 s
		}
		else if (dateTime.getMinutes() !== 0) {
			offset = 1000 * 60; // 1 minute
		}
		else if (dateTime.getHours() !== 0) {
			offset = 1000 * 60 * 60; //1 hour
		}
		else {
			offset = 1000 * 60 * 60 * 24; //24 hour
		}

		//{"prop":{"$lte":"1946-07-01T22:01:00.000Z","$gt":"1940-07-01T22:01:00.000Z"}}
		var dStart = dateTime.toISOString();
		var dEnd = new Date(dateTime.getTime() + offset).toISOString();
		
		return '{"'+ property +'":{"$gte":"' +  dStart + '","$lt":"' + dEnd + '"}}';			
	}


	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	function isDateTime(str) {
		return /^\d+\/\d+\/\d+ \d+:\d+$/.test(str);
	}
	/*
	function isTime(str) {
		return /^\d+:\d+$/.test(str);
	}
	*/
	function isDate(str) {
		return /^\d+\/\d+\/\d+$/.test(str);
	}
	function toDateTime(str) {
		// dd/MM/yyy  hh:mm
		var parts = str.match(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+)/);
		if (parts[3].length==2) {
			var num = Number(parts[3]);
			if (num < 20) {
				parts[3] = num + 2000;
			}
			else {
				parts[3] = num + 1900;
			}
		}
		//dd/MM/yyyy Assuming Spanish formar for dates
		return new Date(parts[3], Number(parts[2])-1, Number(parts[1]), Number(parts[4]), Number(parts[5]));
	}
	/*
	function toTime(str) {
		// hh:mm
		var parts = str.match(/(\d+):(\d+)/);
		return new Date(0, 0, 0, Number(parts[1]), Number(parts[2]));
	}
	*/
	function toDate(str) {
		// dd/MM/yyy
		var parts = str.match(/(\d+)\/(\d+)\/(\d+)/);
		if (parts[3].length==2) {
			var num = Number(parts[3]);
			if (num < 20) {
				parts[3] = num + 2000;
			}
			else {
				parts[3] = num + 1900;
			}
		}
		//dd/MM/yyyy Assuming Spanish formar for dates
		return new Date(Number(parts[3]), Number(parts[2])-1, Number(parts[1]));
	}	


	function escapeForRegex(candidate) {
		//escape values for regex
		return candidate;
	}
	var boolValues = {
		"true"	: "true",
		"yes" 	: "true",
		"false"	: "false",
		"no"	: "false"
	};
	function strToBool(candidate) {
		var value = candidate.toLowerCase();
		var boolVal = boolValues[value];

		if (boolVal === null) { 
			return null;
		}
		return boolVal;
	}

	function buildLikeQuery(opts) {
		var deferred = $q.defer();

		if (opts.searchText === null || opts.searchText === '') {
			deferred.resolve(null);
			return deferred.promise;
		}
		
		var clauses = [];

		var searchClauses = opts.searchText.match(/(\w+)((\s*near\s*)|(=))(("[^"]*")|('[^']*')|(\[[^\[]*\])|([^ ]*))\s*/g);

		if (searchClauses == null) {
		    deferred.resolve(buildMoongooseLikeQuery(opts.searchText, opts.fields));
		    return deferred.promise;
		}

		for(var i=0; i<searchClauses.length; i++) {
			var parts = searchClauses[i].match(/(\w+)=(("[^"]*")|('[^']*')|([^ ]*))/);	
			
			if(!parts) {
				// Check near operator
			    parts = searchClauses[i].match(/(\w+)\s+near\s+(("[^"]*")|('[^']*')|(\[[^\[]*\])|([^ ]*))/);
			}

			if(parts && parts.length > 2) {
				var field = parts[1];
				var value = trim(parts[2], ['\'', '"']);
				clauses.push({
					'name': field,
					'value': value
				});
			}

		}
		return buildMoongooseNamedQueries(clauses, opts);
	}
 
	function trim(text, separators) {
		for(var i=0; i< separators.length; i++) {
			var sep = separators[i];
			if (text[0] === sep && text[text.length-1]===sep && text.length>1) {
				var trimmed = text.substr(1, text.length-2);
				return trimmed;
			}
		}
		return text;
	}

	function buildMoongooseNamedQueries(inClauses, opts) {
		var deferred = $q.defer();
		if (!inClauses || !opts || !opts.fields) {
	        
			deferred.resolve(null);
			return deferred.promise;
	    }

		var promises = [];
		for (var i = 0; i < inClauses.length; i++) {
			var inClause = inClauses[i];
			var promise = buildItemClause(inClause, opts);
			if (promise) {
				promises.push(promise);
			}
	    }

		var clauses =[];	
		/* jshint -W083 */
		for(var j=0; j<promises.length; j++) {
			promises[j].then(function (res) {
				clauses.push(res);
			});
		}
		/* jshint +W083 */
		$q.all(promises).then(function(result) {
			deferred.resolve(QueryBuilderService.andBuild(result));
		});
		return deferred.promise;
	}  

	function buildItemClause(inClause, opts) {
		var searchIsNumber = isNumber(inClause.value);
		var searchIsBoolean = strToBool(inClause.value) !== null;
		var searchIsDate = isDate(inClause.value);
		//var searchIsTime = isTime(inClause.value);
		var searchIsDateTime = isDateTime(inClause.value);

		var deferred = $q.defer();

		var field = findField(opts.fields, inClause.name);
		if (field) {
			if (field.type === "geopoint") {
			    return buildPointNear(field.name, inClause.value);
			}
			else if (field.type === "string") {
			    deferred.resolve(buildStringLike(field.name, inClause.value));
			    return deferred.promise;
			}
			else if (searchIsNumber &&
			            (field.type === "number" ||
			             field.type === "int" ||
			             field.type === "long" ||
			             field.type === "decimal" ||
			             field.type === "float"
			            )
			        ) {
			    deferred.resolve(buildNumberEquals(field.name, inClause.value));
			    return deferred.promise;
			}
            else if (searchIsBoolean && field.type === "bool") {
                deferred.resolve(buildBooleanEquals(field.name, inClause.value));
                return deferred.promise;
            }
            else if (searchIsDate && field.type === "date") {
                deferred.resolve(buildDateTimeInRange(field.name, inClause.value));
                return deferred.promise;
            }
            else if (searchIsDateTime && field.type === "datetime") {
                deferred.resolve(buildDateTimeInRange(field.name, inClause.value));
                return deferred.promise;
            }
	        
        }
    	return null;
	}
	
	function findField(metadata, fieldName) {
		for(var i=0; i<metadata.length; i++) {
			var field = metadata[i];
			if  (field.name.toLowerCase() === fieldName.toLowerCase()) {
				return field;
			}
		}
		return null;
	}

	function buildMoongooseLikeQuery(searchText, fieldsMetadata) {
		if (!searchText || !fieldsMetadata ) {
			return null;
		}

		var clauses = [];
		var searchIsNumber = isNumber(searchText);
		var searchIsBoolean = strToBool(searchText) !== null;
		var searchIsDate = isDate(searchText);
		//var searchIsTime = isTime(searchText);
		var searchIsDateTime = isDateTime(searchText);

		for (var i=0; i<fieldsMetadata.length; i++) {
			var field = fieldsMetadata[i];
			if (field.type==="string") {
				clauses.push(buildStringLike(field.name, searchText));
			}
			else if (searchIsNumber && field.type==="int" ||
					 searchIsNumber && field.type==="decimal"
					) {
				clauses.push(buildNumberEquals(field.name, searchText));
			}
			else if (searchIsBoolean && field.type==="bool") {
				clauses.push(buildBooleanEquals(field.name, searchText));
			}
			else if (searchIsDate && field.type==="date") {
				clauses.push(buildDateTimeInRange(field.name, searchText));
			}
			else if (searchIsDateTime && field.type==="datetime") {
				clauses.push(buildDateTimeInRange(field.name, searchText));
			}
		}

		return QueryBuilderService.orBuild(clauses);
	}

	//publish API
	var QueryBuilderService = {
		uriEncode				: uriEncode,
		uriDecode				: uriDecode,
		buildBaucisQuery 		: buildBaucisQuery,
		andBuild 				: andBuild,
		orBuild 				: orBuild,
		buildStringExactMatch 	: buildStringExactMatch,
		buildExactMatch 		: buildExactMatch
	};

	return QueryBuilderService;

}]);