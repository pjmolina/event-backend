//Add export functionality  ----

function addExportDoc(controller) {
    if (!controller.swagger) {
        //init swagger docs
        controller.generateSwagger();
    }

    addMimeTypesToSwaggerDoc(controller, 'GET', '', [
        'application/json',
        'text/csv', 
        'text/xml', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]);

    addSwaggerModelArrayId(controller);
    addSwaggerCustomRoute(controller, 'POST', '/deleteByIds', null, 'deleteByIds', 
                    'Deletes the documents matching the specified IDs (passed by POST data)',
                    null);
  
    enableHints(controller);
}

function enableHints(controller) {
    controller.hints(true);
}

//swagger build helpers ------------------------------
function addSwaggerModelArrayId(controller) {
    var name ="ArrayOfIds";
    
    controller.swagger.apis.models = controller.swagger.apis.models || [];
    
    var model = locateModel(controller.swagger.apis.models, name);
    if (!model) {
        var newModel = {
            "id": name,
            properties: [{
                key: "ids",
                value: {
                    required: "true",
                    type: "Array"  //"string[]" //see how swaggers deals with typed arrays
                    //type: "string[]" 
                }
            }]
        };
        controller.swagger.apis.models.push(newModel);
    }
}
function locateModel(col, key) {
    for(var i=0; i<col.length; i++) {
        var item = col[i];
        if (item.id === key) {
            return item;
        }
    }
    return null;
}

function addMimeTypesToSwaggerDoc(controller, verb, route, mimeTypes) {
    var fullRoute = '/' + controller.model().plural() + route;
    var operation = locateOperation(controller.swagger.apis, verb, fullRoute);
    if (operation) {
        //add extra mime/types
        operation.produces = mimeTypes;
    }
}

function locateOperation(apis, httpVerb, path) {
    for(var i=0; apis.length; i++) {
        var item = apis[i];
        if (item.path === path) {
            for(var j=0; item.operations.length; j++) {
                var op = item.operations[j];
                if (op.httpMethod === httpVerb) {
                    return op;
                }
            }
        }        
    }
    return null;
}

function generateErrorResponses(plural) {
	return [{
		'code': 404,
		'reason': 'No ' + plural + ' matched that query.'  
	}];
}

// A method for capitalizing the first letter of a string
function capitalize (s) {
	if (!s) {
		return s;
	}
	if (s.length === 1) {
		return s.toUpperCase();
	}
	return s[0].toUpperCase() + s.substring(1);
}


function addSwaggerCustomRoute(controller, httpVerb, route, mimeTypes, operationName, description, outType) {
    controller.swagger.apis.push({
        path: '/' + controller.model().plural() + route,
        description: description,
        operations: generateSwaggerCustomOperation(controller, httpVerb, mimeTypes, operationName, 
                                                   description, outType)
    });
}
function generateSwaggerCustomOperation(controller, httpVerb, mimeTypes, operationName, description, outType) {
    var operations = [];

    var operation = {};
    var plural = capitalize(controller.model().plural());

    operation.httpMethod = httpVerb.toUpperCase();
    operation.nickname = operationName;
    operation.responseClass = outType;   
    operation.summary = description;
    operation.parameters = generateArrayIdsParameters();
    operation.errorResponses = generateErrorResponses(plural);
    if (mimeTypes) {
        operation.produces = mimeTypes;     
    }
    operations.push(operation);

    return operations;
}
function generateArrayIdsParameters() {
    var parameters = [];
     
    parameters.push({
        paramType: 'body',
        name: 'ids',
        description: 'Array of Ids: {"ids": [...]}  / string[]).',
        dataType: 'ArrayOfIds',
        required: true,
        allowMultiple: false
    });
    
    return parameters;
}

function apply(controllers) {
    controllers.forEach(function(controller) { 
        addExportDoc(controller); 
    });
}

//Export module 
module.exports = {
    apply : apply
};
