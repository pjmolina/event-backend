angular.module('myApp').service('ImportService', ['MetadataService', 'CsvService', 'XlsxService', '$q', '$http', function(MetadataService, CsvService, XlsxService, $q, $http) {
	var ImportService = {};
	var FileSizeLimit = 20 * 1024 * 1024; //20 Mb

	ImportService.previewData = function (file, className, wsName, candidateRow) {
		var deferred = $q.defer();
		try {
			if (file.size > FileSizeLimit) {
				deferred.reject({ 'error': 'File size limit exceeded. File must be less that 20Mb in size.'});						
			}
			getDataFrom(file, wsName, candidateRow).then(function(data) {
				buildData(data, className, wsName, candidateRow, deferred);
			});
		} catch (e) {
			deferred.reject(e);
		}
		return deferred.promise;
	};
	
	function buildData(data, className, wsName, candidateRow, deferred) {
		MetadataService.getPropertiesFor(className).then(function(expectedProps) {
			var expectedProperties = [];
			for(var i=0; i<expectedProps.length; i++) {
				expectedProperties.push(expectedProps[i].name);
			} 
			expectedProperties.push("_id");

			var dataHeaders = getHeaders(data, wsName, candidateRow);
	
			var colsToImport = intersection(expectedProperties, dataHeaders.groupedProperties) || [];
			var missingCols = diff(expectedProperties, colsToImport);
			missingCols = missingCols.filter(function(item) {
				if (item === null || item === '') {
					return;
				}
				return item;
			});
			
			var ignoredProperties = diff(dataHeaders.groupedProperties, colsToImport);
			
			//rebuild head & lines
			data.headers = dataHeaders.groupedProperties;
			data.lines = getDataForHeaders(data, wsName, candidateRow, dataHeaders);
			
			data.expectedProperties = expectedProperties;
			data.foundProperties = colsToImport;
			data.missingProperties = missingCols;
			data.ignoredProperties = ignoredProperties;
			
			return deferred.resolve(data);	
		});
	}
	
	ImportService.selectDataToImport = function(data, className, ws) {
		var deferred = $q.defer();
		buildData(data, className, ws.name, ws.candidateHeaderLine, deferred); 
		return deferred.promise;
	};
	
	ImportService.importData = function(className, data) {
		var deferred = $q.defer();
		try {
			data.className = className;
			var json =  JSON.stringify(data, null, 2);
			$http.post('/api/import', json)
				.then(function (res) {
					deferred.resolve(res);
				});
		} catch (e) {
			deferred.reject(e);
		}
		return deferred.promise;
	};

	function endsWith(str, suffix) {
		if (!str || !suffix) {
			return false;
		}
		return str.indexOf(suffix, str.length - suffix.length) !== -1;	
	}
	
	function getDataFrom(file, wsName, candidateRow) {
		var deferred = $q.defer();
		try {
			if (file !== null) {
				if (endsWith(file.name, ".csv")) {
					deferred.resolve(CsvService.getDataFrom(file, candidateRow));
				}
				if (endsWith(file.name, ".xlsx")) {
					deferred.resolve(XlsxService.getDataFrom(file, wsName, candidateRow));
				}
			}
		} catch (e) {
			deferred.reject(e);
		}
		return deferred.promise;
	}
	//get headers from first row
	function getHeaders(data, wsName, candidateRow) {
		var res = [];
		var worksheet = selectWorksheet(data, wsName);
		var headerRow = candidateRow || worksheet.candidateHeaderLine || 0;

		var row = worksheet.rows[headerRow];
		
		if (row === null) {
			return [];
		}

		for(var i in row.cells) {
			var cellData = row.cells[i];
			if (cellData !== null && cellData !== '') {
				var calcIdentifier = buildColumnName(toPascal(cellData));
				res.push(calcIdentifier);
			}
		}
		var mapFields = groupFields(res);		
		var groupedProperties = getGroupedFields(mapFields);

		return {
			groupedProperties : groupedProperties,
			plainProperties   : res,
			mapInfo : mapFields
		};
	}

	function getGroupedFields(mapInfo) {
		var res = [];
		for(var i=0; i<mapInfo.length; i++) {
			var item = mapInfo[i];
			if (typeof item === 'string') {
				res.push(item);
			}
			else {	
				res.push(item.name);	
			}
		}
		return res;
	}

	function groupFields(col) {
		var res = col.slice();

		while (hasGeoPoints(res)) {
			var newPropMap = extractGeoPointProperty(res);
			res.push(newPropMap);
		} 
		return res;
	}
	function hasGeoPoints(res) {
		var lat = containsEndingWith(res, 'Latitude');
		if (lat) {
			var lng = containsEndingWith(res, 'Longitude');
			if (lng) {
				return true;
			}
		}
		return false;
	}
	
	function containsEndingWith(array, value) {
		var i = array.length;
		while (i--) {
			var candidate = array[i];
			if (typeof candidate === 'string' && endsWith(candidate, value)) {
				return candidate;
			}
		}
		return null;
	}

	function extractGeoPointProperty(res) {
		var lat = containsEndingWith(res, 'Latitude');
		if (lat) {
			var prop = lat.substring(0, lat.length-'Latitude'.length);
			var lng = containsEndingWith(res, 'Longitude');
			if (lng) {
				removeItem(res, prop+'Latitude');
				removeItem(res, prop+'Longitude');
				return { 
					name: prop,
					type: 'geopoint',
					groups: [prop+'Latitude', prop+'Longitude']
				};
			}
		}
		return null;
	}

	function removeItem(res, searched) {
		for(var i=0; i<res.length; i++) {
			var item = res[i];
			if (item === searched) {
				res.splice(i, 1);
				return;
			}
		}
		return;
	}
	function buildColumnName(candidate) {
		return toCamel(sanitizeIdentifier(toPascal(candidate)));
	}
	
	function sanitizeIdentifier(candidate) {
		if (candidate === null) {
			return null;
		}
		if (isNumber(candidate)) {
			candidate = "N"+candidate;
		}
		var str = candidate.replace(/\s+/g, ''); //remove spaces
		str = str.replace(/[^a-zA-Z0-9.-]/g, '_'); //replace illegal chars with "_"
		return str;
	}
	function toPascal(input) {
		if (input === null) {
			return null;
		}
		var s = input.toString().replace(/(\w)(\w*)/g, function(g0,g1,g2) {	
			return g1.toUpperCase() + ( isAllCaps(g2) ? g2.toLowerCase() : g2 );
		});
		return s;
	}
	function isAllCaps(text) {
		return ! /[a-z]/g.test(text);
	}

	function toCamel(input) {
		if (input === null) {
			return null;
		}
		var s = input.toString().replace(/(\w)(\w*)/g, function(g0,g1,g2) {	
			return g1.toLowerCase() + g2;
		});
		return s;
	}
	
	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	
	function getDataForHeaders(data, wsName, candidateRow, dataHeaders) {
		var maps = buildTransformMaps(dataHeaders);
		var res = [];
		var worksheet = selectWorksheet(data, wsName);
		var headerRow = candidateRow || worksheet.candidateHeaderLine || 0;

		for(var i in worksheet.rows) {
			if (i <= headerRow) {
				continue; //skip rows over the header
			}
			var row = worksheet.rows[i];
			//transform row: group values in row
			var rowProcessed = groupRowData(row, maps);

			res.push(rowProcessed);
		}		
		return res;
	}

	function buildTransformMaps(dataHeaders) {
		var maps = [];
		for (var i=0; i<dataHeaders.mapInfo.length; i++) {
			var item = dataHeaders.mapInfo[i];
			if (typeof item === 'string') {
			//direct map ->
				var map = { 
					from: [{
						name: item,
						colIndex: getColIndex(dataHeaders.plainProperties, item)
					}],
					to: {
						name: item,
						colIndex: getColIndex(dataHeaders.groupedProperties, item)
					}
				};
				maps.push(map);
			}
			else if (item.type=== 'geopoint') {
				//geopoint
				var map2 = { 
					type: item.type,
					from: [
					{
						name: item.groups[0],
						colIndex: getColIndex(dataHeaders.plainProperties, item.groups[0])
					},
					{
						name: item.groups[1],
						colIndex: getColIndex(dataHeaders.plainProperties, item.groups[1])
					}],
					to: {
						name: item.name,						
						colIndex: getColIndex(dataHeaders.groupedProperties, item.name)
					}
				};
				maps.push(map2);
			}
		}
		return maps;
	}

	function getColIndex(col, key) {
		for (var i=0; i<col.length; i++) {
			var value=col[i];
			if (value === key) {
				return i;
			}
		}
		return -1;
	}

	function groupRowData(row, maps) {
		var cells = [];

		for (var i=0; i<maps.length; i++) {
			var map=maps[i];

			if (map.from.length == 1) {
				//direct map:
				cells[map.to.colIndex] = row.cells[map.from[0].colIndex];
			}
			else if (map.type === 'geopoint') {
				cells[map.to.colIndex] = buildGeoPoint(
											row.cells[map.from[0].colIndex],
											row.cells[map.from[1].colIndex]);
			}
		}
		return  {
			line: row.line,
			cells: cells
		};
	}

	function buildGeoPoint(lat, lng) {
		//user string 
		return lat + ', ' + lng;
	}
	
	function selectWorksheet(data, name) {
		if (name !== undefined) {
			for(var index in data.workSheets) {
				var item = data.workSheets[index];
				if (item.name == name) {
					return item;
				}
			}
		}
		if (data.workSheets && data.workSheets.length > 0) {
			return data.workSheets[0];
		}
		return null;
	}
	
	function cloneArrayToLowerCase(array) {
		var res = [];
		array.forEach(function(item) {
			res.push(item.toLowerCase());
		});
		return res;
	}
	
	//lowerCase  intersection a1  a2
	function intersection(a1, a2) {
		var copy = cloneArrayToLowerCase(a2);
		var res = a1.filter(function(item) {
			return copy.indexOf(item.toLowerCase()) != -1;
		});
		return res;
	}
	//lowerCase diff a1  a2
	function diff(a1, a2) {
		var copy = cloneArrayToLowerCase(a2);
		var res = a1.filter(function(item) {
			return (copy.indexOf(item.toLowerCase()) <= -1);
		});
		return res;
	}
	
	return ImportService;
}]);