var Q = require('q');
var models = require('../model');

var importData = function(req, res) {   
  try {
    
    var result = {
      'errors' : []
    };
    var importedCreated = 0;
    var importedUpdated = 0;
    var headers = req.body.headers;
    var schema = models.getMetadataForClass(req.body.className).schema;
    var model = models.getModelForClass(req.body.className);
    if (!model) {
      res.status(400).send('Invalid class for import: ' + req.body.className);
      return;
    }
    var promises = req.body.lines.map(function(row){

        var id = getId(headers, row);
        if (id) {
          var updateFields = buildUpdateFields(headers, row, schema);
          return Q.nfcall(updateEntity, model, id, updateFields)
          .then(function (entity) {
            if (entity) {
              importedUpdated++;
            }
            else {
              var fields = buildUpdateFields(headers, row, schema);
              //try to include id:
              fields._id = id;
              return Q.nfcall(createEntity, model, fields)
              .then(function (entity) {
                importedCreated++;
              })
              .fail(function (err) {
                result.errors.push({
                  'line': row.line, 
                  'error': err
                });
              });             
            }
          })
          .fail(function (err) {
            result.errors.push({
              'line': row.line, 
              'error': err
            });
          });
        }
        else {
          var fields = buildUpdateFields(headers, row, schema);
          return Q.nfcall(createEntity, model, fields)
          .then(function (entity) {
            importedCreated++;
          })
          .fail(function (err) {
            result.errors.push({
              'line': row.line, 
              'error': err
            });
          });
        }
    });
    
    Q.all(promises)
    .then(function(obj) { 
      result.importedCount = importedUpdated + importedCreated; 
      result.insertCount = importedCreated; 
      result.updatedCount = importedUpdated; 
      res.status(200).send(result);
    })
    .fail(function(err) { 
      console.log('import: failed ' + err); 
      result.importedCount = importedUpdated + importedCreated; 
      result.insertCount = importedCreated; 
      result.updatedCount = importedUpdated; 
      res.status(200).send(result);
    });

  }
  catch (e) {
    res.status(400).send('Invalid request. ' + e);
    console.error(e); 
    return;     
  }
};

function updateEntity(model, id, updateFields, callback){
  model.findByIdAndUpdate(id, updateFields, null, function(err, entity) {
    callback(err, entity);
  });
}

function createEntity(model, updateFields, callback){
  model.create(updateFields, function(err, entity) {
    callback(err, entity);
  });
}

function getId(headers, row) {
  for(var index in headers){
    var head = headers[index];
    if (head === '_id') {
      var data = row.cells[index];
      if (data === '' || data === null) {
        return null;
      }
      return data;
    }
  }
  return null;
}

function buildUpdateFields(headers, row, schema) {
  var updateFields= {};
  for(var index in headers){
    var head = headers[index];
    if (head == '_id') {
      continue;
    }
    updateFields[head] = convertValue(row.cells[index], head, schema);
  }
  return updateFields;
}
function convertValue(value, key, schema) {
  if (propertyIsGeopoint(key, schema)) {
    var geoPoint = convertToGeoPoint(value);  
    return geoPoint;
  }
  return value;
}
function propertyIsGeopoint(key, schema) {
  var hasType = false;
  var hasCoordinates = false;
  
  for (var path in schema.paths) {
    if (schema.paths.hasOwnProperty(path)) {
      if (path === key+'.type') {
        hasType = true;
      }
      if (path === key+'.coordinates') {
        hasCoordinates = true;
      }
    }
  }
  return hasType && hasCoordinates;
}

function convertToGeoPoint(value) {
  if (!value) {
    return null;
  }
  if (value.type && value.coordinates) {
    return value;
  }
  if (typeof value === 'string') {
    var parts = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/.exec(value);
    if (parts) {
      return {
        type: 'Point',
        coordinates: [ Number(parts[2]), Number(parts[1]) ]
      };
    }
  }
  return null;
}

function apply(app) {
    app.post('/api/import', function(req, res) {
        return importData(req, res);
    });
}

module.exports.apply = apply;