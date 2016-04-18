//Metamodel
function Metamodel(options) {
	options = options || {};
	this.classes = options.classes || [];
	this.associations = options.associations || [];	
}
Metamodel.prototype.addClass = function(cl) {
	this.classes.push(cl);
	return this;	
};
Metamodel.prototype.getClassByName = function(clName, ignoreCase) {
	ignoreCase = ignoreCase || true;
	return findByPropInCollection(this.classes, 'name', clName, ignoreCase);
};
Metamodel.prototype.addAssociation = function(association) {
	this.associations.push(association);
	return this;	
};

Metamodel.prototype.isRootClass = function(className) {
	return !this.isEmbededClass(className);
};

Metamodel.prototype.isEmbededClass = function(className) {
    for (var i = 0; i < this.associations.length; i++) {
        var association = this.associations[i];
        if (association.composition && association.bClass.toLowerCase() === className.toLowerCase()) {
            return true;
        }
    }
    return false;
};


function getBinaryPropertiesForClass(model, clName) {
	var cl = model.getClassByName(clName, true);
	if (!cl) {
		return [];
	}

	var props = cl.getBinaryProperties();

	model.associations.forEach(function (association) {
		if (association.composition && association.aClass === clName) {
			var childBinProps = getBinaryPropertiesForClass(model, association.bClass);
			childBinProps.forEach(function (element) {
				element.name = camelize(association.aRole) + '.' + camelize(element.name);
				props.push(element);
			});
		}
	});

	return props;
}

Metamodel.prototype.getBinaryPropertiesForClass = function (clName) {
	return getBinaryPropertiesForClass(this, clName);
};

//Class
function Class(options) {
	options = options || {};
	this.name = options.name || null;		
	this.attributes = options.attributes || [];
	this.operations = options.operations || [];		
}
Class.prototype.addAttribute = function(atr) {
	this.attributes.push(atr);
	return this;
};
Class.prototype.getAttributeByName = function(atrName, ignoreCase) {
	ignoreCase = ignoreCase || true;
	return findByPropInCollection(this.attributes, 'name', atrName, true);
};
Class.prototype.filterPropertiesWithType = function(typeValue) {
	return filterByPropInCollection(this.attributes, 'type', typeValue, false);
};
Class.prototype.getBinaryProperties = function() {
	var propFiles = this.filterPropertiesWithType('file');
	var propImages = this.filterPropertiesWithType('image');
	return propImages.concat(propFiles);
};

//Attribute
function Attribute(options) {
	options = options || {};
	this.name = options.name || null;		
	this.type = options.type || 'string';		
	this.required = options.required || false;
}

//Associations
function Association(options) {
	options = options || {};
	this.name = options.name || null;
	this.composition = options.composition || false;
	this.bridge = options.bridge || null;
	
	this.aClass = options.aClass || null;
	this.aRole = options.aRole || null;
	this.aMinCardinality = options.aMinCardinality || null;
	this.aMaxCardinality = options.aMaxCardinality || null;
	
	this.bClass = options.bClass || null;
	this.bRole = options.bRole || null;
	this.bMinCardinality = options.bMinCardinality || null;
	this.bMaxCardinality = options.bMaxCardinality || null;
}

Association.prototype.isSourceOptional = function(typeValue) {
    return this.aMinCardinality ? false : true;
};

Association.prototype.isSourceMultiple = function(typeValue) {
	return this.aMaxCardinality > 1;
};

Association.prototype.isTargetOptional = function(typeValue) {
    return this.bMinCardinality ? false : true;
};

Association.prototype.isTargetMultiple = function(typeValue) {
	return this.bMaxCardinality > 1;
};

//Operation
function Operation(options) {
	options = options || {};
	this.name = options.name || null;		
	this.isCreation = options.isCreation || false;		
	this.isQuery = options.isQuery || false;		
	this.isUpdate = options.isUpdate || false;		
	this.isDeletion = options.isDeletion || false;		
}

//-- helpers functions ---------------
function findByPropInCollection(col, propName, value, ignoreCase) {
	var normalized = value || '';
	if (ignoreCase) {
		normalized = normalized.toUpperCase();
	}
	if (!col) {
		return null;
	}
	for(var i=0; i<col.length; i++) {
		var item = col[i];
		var candidate = item[propName];
		if (ignoreCase) {
			candidate = (candidate || '').toUpperCase();
		}
		if (normalized === candidate) {
			return item;
		}
	}
	return null;
}
function filterByPropInCollection(col, propName, value, ignoreCase) {
	var normalized = value || '';
	var res = [];
	if (!col) {
		return res;
	}
	if (ignoreCase) {
		normalized = normalized.toUpperCase();
	}
	for(var i=0; i<col.length; i++) {
		var item = col[i];
		var candidate = item[propName];
		if (ignoreCase) {
			candidate = (candidate || '').toUpperCase();
		}
		if (normalized === candidate) {
			res.push(item);
		}
	}
	return res;
}
function camelize(s) {
	if (!s) {
		return s;
	}
	if (s.length === 1) {
		return s.toLowerCase();
	}
	return s[0].toLowerCase() + s.substring(1);
}
//---------------------

module.exports = {
	Metamodel: Metamodel,
	Class: Class,
	Attribute: Attribute,
	Association: Association,
	Operation: Operation
};