// Adds general decorators for baucis. 
// Different response based on HTTP Accept headers------
var xlsx = require('xlsx');
var models = require('../model');
var utilities = require('./utilities');

var securityModule = null;

function setAuthZModule(secModule) {
	securityModule = secModule;
	securityModule.registerOperationMiddleware(deleteByIdOperationMiddleware);
}

function apply(baucis) {
	baucis.Controller.decorators(function (options, protect) {
		var controller = this;
		
		controller.query('get', function (req, res, next) {
			var mime = req.headers.accept || "application/json";
			
			if (mime === "text/csv") {
				responseAsCsv(controller, req, res);
				return;
			}
			if (mime === "text/xml") {
				responseAsXml(controller, req, res);
				return;
			}
			if (mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
			    mime === "xlsx") {
				responseAsXlsx(controller, req, res);
				return;
			}
			else {
				next();
			}		
		});

		controller.post('/deleteByIds', function (req, res, next) {
			//Delete specific ids
			var ids = req.body;
			if (!ids.length || ids.length === 0 ) {
				return sendErrorArgument(res, 'ids', 'Ids to delete not provided. Expecting an array of ids.');
			}
			var model = controller.model();
			for(var index in ids) {
				var idItem = ids[index];
				model.findOneAndRemove( {'_id': idItem}, postDeleteItem);
			}  
			return sendAccepted(res);  
		});

	});
}


function deleteByIdOperationMiddleware(req, operation) {
	if (utilities.endsWith(req.url.split('?')[0], '/deleteByIds')) {
		operation.verb = 'DELETE';
		operation.objectIds = req.body instanceof Array ? req.body : [];
	}	
}

function sendErrorArgument(res, argName, message) {
	res.status(412)
	   .set('Content-Type', 'application/json')
	   .send({
	   	 parameter: argName,
	   	 message: message,
	   	 kind: 'required'
	   })
	   .end();	
}
function sendAccepted(res) {
	res.status(202)
	   .set('Content-Type', 'application/json')
	   .send({})
	   .end();	
}

function postDeleteItem(err, item) {
	if (err) {
		consoleError(err);
	}
	else {
		console.log('Object: ' + item + ' has been deleted.');
	}
}

function consoleError(err){
	if (err) {
		console.error(err);
	}
}

function responseAsCsv(controller, req, res) {
	var model = controller.model();
	req.baucis.query.exec(function (err, objects) {
		if (!err) {
			res.status(200)
			   .type("text/csv")
			   .attachment(model.plural() + '.csv')
			   .send(toCsv(objects, model.singular()))
			   .end();  
			return;		
		}
		else {
			res.status(500)
			   .type('application/json')
			   .send({'error': err})
			   .end();  
			return;
		}
	});
}
function responseAsXml(controller, req, res) {
	var model = controller.model();
	req.baucis.query.exec(function (err, objects) {
		if (!err) {
			res.status(200)
			   .type("text/xml")
			   .attachment(model.plural() + '.xml')
			   .send(toXml(objects, model.singular()))
			   .end();  
			return;		
		}
		else {
			res.status(500)
			   .type('application/json')
			   .send({'error': err})
			   .end();  
			return;
		}
	});	
}
function responseAsXlsx(controller, req, res) {
	var model = controller.model();
	req.baucis.query.exec(function (err, objects) {
		if (!err) {
			res.status(200)
			   .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
			   .attachment(model.plural() + '.xlsx')
			   .send(toXlsx(objects, model.singular()))
			   .end();  
			return;		
		}
		else {
			res.status(500)
			   .type('application/json')
			   .send({'error': err})
			   .end();  
			return;
		}
	});	
}

//----- Export helpers for CSV
function getCsvHeader(className) {
	var res="_id"; 
	var prefix=",";
	var props = models.propertiesForClass[className];
	if (props) {
		for(var index in props) {
			res += prefix + csvEncode(props[index]);
		}
		return res+"\r\n";
	}
	return null;
}
function toCsv(objects, className) {
	var res = "sep=,\r\n" + getCsvHeader(className);
	var props = models.propertiesForClass[className];
	if (props) {
		for(var j in objects) {
			var item = objects[j];
			res += item._id;
			var prefix = ",";
			for(var index in props) {
				var value = item[props[index]];
				var strValue = complexToString(value);
				res += prefix + csvEncode(strValue);
			}
			res +="\r\n";
		}
	}
	return res;
}
function complexToString(value) {
	if (value && value.type) {
		//geo-point
		if (value.type === 'Point') {
			if (value.coordinates && value.coordinates[0] && value.coordinates[1]) {
				return value.coordinates[1] + ", " + value.coordinates[0];
			}
			return null;
		}
	} 
	else {
		return value;
	}
}
function isObjectId(obj) {
 	return (typeof obj === 'object' && obj._bsontype === 'ObjectID');
}
function csvEncode(data) {
	var text;
	if (data === null) {
	return '';
	}
	if (isObjectId(data)) {
		return data.toString();
	}
	if (data.type === 'Point') {
		if (data.coordinates && data.coordinates[0] && data.coordinates[1]) {
	    	return '"[' + data.coordinates[1] + ', ' + data.coordinates[0] +']"';
	    } else {
	    	return null;
	    }
	}

	text = data.toString();

	if ((text.indexOf(',') >= 0) || (text.indexOf('.') >= 0) || (text.indexOf(' ') >= 0)) {
	return '"' + text + '"';
	}   
	return text;
}

//----- Export helpers for XML
function toXml(objects, className) {
	var res = '<?xml version="1.0" encoding="UTF-8"?>\r\n<data>\r\n';
	var props = models.propertiesForClass[className];
	if (props) {
		for(var j in objects) {
			var item = objects[j];
			res += '  <' + className + '><id>' + item._id + '</id>';
			for(var index in props) {
				var prop = props[index];
				var value = item[prop];
				if (value && value.type === 'Point') {
					res += '<'+ prop + '><lat>' + xmlEncode(value.coordinates[1]) + 
					       '</lat><lng>'+ xmlEncode(value.coordinates[0]) +'</lng></' + prop + '>';
				}
				else {
					res += '<'+ prop + '>' + xmlEncode(value) + '</' + prop + '>';
				}
			}
			res +='</' + className + '>\r\n';
		}
	}
	return res + "</data>\r\n";
}
function xmlEncode(data) {
  	if (data === null) {
  		return '';
  	}
	if (data.type === 'Point') {
    	if (data.coordinates && data.coordinates[0] && data.coordinates[1]) {
      		return '<lat>' + data.coordinates[1] + '</lat><lng>' + data.coordinates[0] +'</lng>';
    	} else {
     		return null;
	   	}
  	}   
  var res = data.toString().replace(/&/g, '&amp;')
                .replace(/'/g, '&apos;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
  ;
  return res;
}

//----- Export helpers for XLSX
function toXlsx(objects, className) {
  var ws_name = className;
  var wb = {
    SheetNames: [],
    Sheets: {}
  };

  var properties = models.propertiesForClass[className];

  var data = [];
  //add labels
  var headers = [ "_id" ];
  for(var z in properties) {
    headers.push(properties[z]);
  }
  data.push(headers);

  for(var i in objects) {
    var row = objects[i];
    var rowItem = [ row._id ];

    for(var key in properties) {
      var value = row[properties[key]];
      var vs = complexToString(value);
      rowItem.push(vs);
    }
    data.push(rowItem);
  }
  
  var ws = sheetFromArrayOfArrays(data);
  wb.SheetNames.push(ws_name);
  wb.Sheets[ws_name] = ws;

  var wbbuf = xlsx.write(wb, { type: 'buffer' });
  return wbbuf;
} 
 
function sheetFromArrayOfArrays(data, opts) {
  var ws = {};
  var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
  for(var R = 0; R != data.length; ++R) {
    for(var C = 0; C != data[R].length; ++C) {
      if(range.s.r > R) { range.s.r = R; }
      if(range.s.c > C) { range.s.c = C; }
      if(range.e.r < R) {  range.e.r = R; }
      if(range.e.c < C) {  range.e.c = C; }
      var cell = {v: data[R][C] };
      if(cell.v === null) { continue; }
      var cell_ref = xlsx.utils.encode_cell({c:C,r:R});
      
      if(typeof cell.v === 'number') { cell.t = 'n'; }
      else if(typeof cell.v === 'boolean') { cell.t = 'b'; }
      else if(cell.v instanceof Date) {
        cell.t = 'n'; cell.z = xlsx.SSF._table[14];
        cell.v = datenum(cell.v);
      }
      else {
      	cell.t = 's';
      }
      ws[cell_ref] = cell;
    }
  }
  if(range.s.c < 10000000) { 
  	ws['!ref'] = xlsx.utils.encode_range(range);
  }
  return ws;
}

function datenum(v, date1904) {
	if(date1904) {
		v+=1462;
	}
	var epoch = Date.parse(v);
	return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

module.exports = {
	apply : apply,
	setAuthZModule : setAuthZModule
};