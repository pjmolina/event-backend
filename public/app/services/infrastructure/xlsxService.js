angular.module('myApp').service('XlsxService', ['$q', '$window', function($q, $window) {
	var XlsxService = {};
	
	XlsxService.getDataFrom = function (file, wsName, candidateRow) {
		var deferred = $q.defer();
		try {
			var reader = new FileReader();
			reader.onload = function(e) { 
				var contents = e.target.result;
				var res = processData(contents, file, wsName, candidateRow);
				deferred.resolve(res);
			};
			reader.readAsArrayBuffer(file);
		
		} catch (e) {
			deferred.reject(e);
		}
		return deferred.promise;
	};
	
	function processData(binaryContent, file, wsName, headerRow) {
		
		var workbook = $window.XLSX.read(binaryContent, {type: 'binary'});
		
		var cellData = loadData(workbook);
		
		var wsCollection = [];
		workbook.SheetNames.forEach(function(sheetName) {
			var sheetData = findByName(cellData, sheetName);
			if (sheetData !== null) {
				var data = getData(sheetName, cellData, 0);
				var candidateHeaderLine = sheetData.candidateHeaderLine;
				wsCollection.push({
					'name': sheetData.name,
					'rows': data,
					'candidateHeaderLine': candidateHeaderLine
				}); 
			}
		});
		
		wsName = wsName || wsCollection[0].name;
		headerRow = headerRow || wsCollection[0].candidateHeaderLine;
		
		
		var res = { 
			fileName: file.name,
			workSheets:	wsCollection,
			currentWorkSheet: wsName,
			candidateHeaderLine: headerRow,
			error : null
			//headers : headers,
			//lines : lines
		};		
		return res;
	}

	function findByName(collection, name) {
		for(var index in collection) {
			var item = collection[index];
			if (item.name == name) {
				return item;
			}
		}
		return null;
	}
	
	var cellRegex = /([A-Z]+)(\d+)/g;
	
	function loadData(workbook) {
		var result = [];
		workbook.SheetNames.forEach(function(sheetName) {
			//var start = new Date().getTime();
			var worksheet = workbook.Sheets[sheetName];
			var ws = { name: sheetName, rows: []};

			var hashRowBucket = {};
			
			var line = 0;
			var col = '';
			var parsed;
			
			for (var row in worksheet) {
				if(row[0] === '!') {
					continue;
				}
				cellRegex.lastIndex = 0;
				parsed = cellRegex.exec(row);
				col = parsed[1];							
				line = Number(parsed[2]);
								
				insertCellValue(hashRowBucket, line, col, worksheet[row]);
			}
			
			ws.rows = hashToArrayRows(hashRowBucket);
			
			//var end = new Date().getTime();
			//var ellapsed = end - start;
			//console.log('loading sheet: ' + sheetName + ' : ' + ellapsed + "ms");

			ws.candidateHeaderLine = locateHeader(ws);
			
			if (ws.rows.length > 0) {
				//Include in preview (discard if has no data)
				fillEmptySpaces(ws);
				result.push(ws);
			}	
		});		
		return result;
	}
	
	function hashToArrayRows(hashRows) {
		var rowsArray = [];
		for (var key in hashRows) {
			rowsArray.push(hashToArrayCells(hashRows[key]));			
		}
		//sort lines
		rowsArray.sort(function(a,b) { 
			return a.line - b.line; 
		});
		return rowsArray;
	}
	
	function hashToArrayCells(rowContent) {
		var cellsArray = [];
		var output = {
			'line'   : rowContent.line,
			'cells' : cellsArray 
		};
		for (var key in rowContent.cells) {
			cellsArray.push(rowContent.cells[key]);			
		}
		//sort lines
		cellsArray.sort(function(a,b) { 
			return convertColToNumber(a.col) - convertColToNumber(b.col); 
		});
		return output;
	}
	
	function insertCellValue(rows, line, col, cellContent) {
		var row = rows[line]; //locateRow(rows, line);
		if (row === null) {
			//insert row
			row = {'line': line, cells: {} };
			rows[line] = row;
		}
		//insert cell
		var colIndex = convertColToNumber(col);
		row.cells[colIndex] = {
			'col': col, 
			'v' : cellContent.v,
			'prev' : getPreviewValue(cellContent)
		};
	}

	function getPreviewValue(cellContent){
		if (isDateTime(cellContent.w)){
			return toDateTime(cellContent.w);
		}
		else if (isTime(cellContent.w)){
			return toTime(cellContent.w);
		}
		else if (isDate(cellContent.w)){
			return toDate(cellContent.w);
		}
		return cellContent.v;
	}
	function isDateTime(str) {
		return /^\d+\/\d+\/\d+ \d+:\d+$/.test(str);
	}
	function isTime(str) {
		return /^\d+:\d+$/.test(str);
	}
	function isDate(str) {
		return /^\d+\/\d+\/\d+$/.test(str);
	}

	function toDateTime(str) {
		var parts = str.match(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+)/);
		if (parts[3].length==2) {
			parts[3] = Number(parts[3]) + 2000;
		}
		return new Date(parts[3], Number(parts[1])-1, Number(parts[2]), Number(parts[4]), Number(parts[5]));
	}
	function toTime(str) {
		var parts = str.match(/(\d+):(\d+)/);
		return new Date(0, 0, 0, Number(parts[1]), Number(parts[2]));
	}
	function toDate(str) {
		var parts = str.match(/(\d+)\/(\d+)\/(\d+)/);
		if (parts[3].length==2) {
			parts[3] = Number(parts[3]) + 2000;
		}
		return new Date(Number(parts[3]), Number(parts[1])-1, Number(parts[2]));
	}	

	function locateHeader(worksheetData) {
		var candidate = 0;
		var lineSize = 0;
		var index = 0;
		for(var i in worksheetData.rows) {
			var row = worksheetData.rows[i];
			if (row.cells.length > lineSize) {
				//New candidate found
				candidate = index;
				lineSize = row.cells.length;
			}
			index++;
		}
		return candidate;
	}
	
	var asciiA = 'A'.charCodeAt(0);
	var asciiZ = 'Z'.charCodeAt(0);
	
	function convertColToNumber(colText) {
		var result = 0;
		if (colText.length > 0) {
			result = colText.toUpperCase().charCodeAt(0) - asciiA + 1;
		}
		if (colText.length == 2) {
			result = result * (asciiZ - asciiA + 1 ) + 
						colText.toUpperCase().charCodeAt(1) - asciiA + 1;
		}
		return result;
	}
	function convertNumberToCol(index) {
		var result = '';
		var base = asciiZ - asciiA + 1;
		var div = index;
		do  {
			var mod = (div  - 1) % base;
			div = Math.floor((div - 1)/base);
			result = String.fromCharCode(asciiA + mod) + result;

		} while (div > 0);

		return result;
	}
	
	function fillEmptySpaces(wbook) {
		var maxCol = getMaxCol(wbook);
		//complete till maxCol
		for(var index in wbook.rows) {
			var row = wbook.rows[index];
			for (var j=0; j<maxCol; j++) {
				var colj =convertNumberToCol(j+1);
				var cell = locateCellByColName(row, colj);
				if (cell == null) {
					//slow
					row.cells.splice(j, 0, {
							col: colj,
							v: null 
						});
				}
			}
		}
	}

	function locateCellByColName(row, colName) {
		for(var index in row.cells) {
			var cell = row.cells[index];
			if (cell.col == colName) {
				return cell;
			}
		}
		return null;
	}
	
	function getMaxCol(wbook) {
		var maxCols = 0;
		for(var index in wbook.rows) {
			var row = wbook.rows[index];
			for (var j in row.cells) {
				var cell = row.cells[j];
				var candidate = convertColToNumber(cell.col);
				if (candidate > maxCols) {
					maxCols = candidate; 
				}
			}
		}
		return maxCols;
	}
	
	/*
	function getHeaders(wsName, wbData, headerRow) {
		var wb = wbData.filter(function(item) {
			if (item.name == wsName) {
				return item;
			}
		})[0];
		var row = wb.rows[headerRow];
		var result = [];
		
		row.cells.filter(function(item) {
			var cell = item.v.v;
			if (cell != null && cell!=='') {
				result.push(cell);
			}			
		}); 
		return result;
	}
	*/
	function getData(wsName, wbData, headerRow) {
		var wb = wbData.filter(function(item) {
			if (item.name == wsName) {
				return item;
			}
		})[0];
	
		var rows = [];
		if (wb === null || !wb.rows){
			return rows;
		}		
		for(var index = headerRow; index < wb.rows.length; index++) {
			var sourceRow = wb.rows[index];
			var row = {
				'line' : index,
				'cells': getValuesFromCells(sourceRow.cells)
			};
			if (row.cells.length > 0){
				rows.push(row);
			}
		}
		return rows;
	}
	
	function getValuesFromCells(cells) {
		var values  = [];
		cells.filter(function(item){
			if (item.prev !== null){
				values.push(item.prev);
			}
			else {
				values.push(item.v);
			}
			//values.push(item.v);
			
		});
		return values;
	}
	
	return XlsxService;
}]);
