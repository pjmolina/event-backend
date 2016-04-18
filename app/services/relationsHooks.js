var es = require('event-stream');
var utilities = require('./utilities');
var metamodel = require('../metamodel');

var entityModels;

function apply(models) {

    entityModels = models.models;
    metamodel.associations.forEach(function (association) {

        if(association.composition || !models.models[association.aClass] || !models.models[association.bClass]) {
            return;            
        }
        
        var sourceController = models.models[association.aClass].controller;
        var targetController = models.models[association.bClass].controller;

        if (association.isSourceMultiple() && association.isTargetMultiple()) { // [Many to Many]
            buildManyToManyApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole, association.name, association.isSourceOptional());
            buildManyToManyApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole, association.name, association.isTargetOptional());
        }
        else if (!association.isSourceMultiple() && !association.isTargetMultiple()) { // [One to One]
            if (association.isSourceOptional()) {
                buildManyCardinalityApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole, true, association.isTargetOptional());
                buildOneCardinalityApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole);
            }
            else {
                buildOneCardinalityApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole);
                buildManyCardinalityApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole, true, association.isSourceOptional());
            }
        }
        else { // [One to Many], [Many to One]
            if (association.isSourceMultiple()) {
                buildManyCardinalityApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole, false, association.isTargetOptional());
            }
            else {
                buildOneCardinalityApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole);
            }
            if (association.isTargetMultiple()) {
                buildManyCardinalityApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole, false, association.isSourceOptional());
            }
            else {
                buildOneCardinalityApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole);
            }
        }
    });

    metamodel.classes.forEach(function (cl) {
        var className = camelize(cl.name);
        var model = models.models[className];
        
        if(!model) {
            return;
        }
        
        var manyRoles = getManyRoles(className);
        if (manyRoles.length !== 0) {
            buildManyRoleApis(model.controller, manyRoles);
        }
        
        var requiredCompositeRoles = getRequiredCompositeRoles(className);
        if (manyRoles.length !== 0) {
            validateRequiredCompositeRoles(model.controller, requiredCompositeRoles);
        }

        var relatedRoles = getRelatedRoles(className);
        if (relatedRoles.length !== 0) {
            validateDeleteRequest(model.controller, relatedRoles, className);
        }
        
        var halRoles = getHalRoles(className);
        if (halRoles.length > 0) {
            buildHalForRelations(model.controller, halRoles);
        }

    });
}

function buildManyToManyApis(controller, sourceName, targetName, sourceRole, targetRole, bridge, optional) {
    
    //Retrieves the linked items
    controller.get('/:id/' + sourceRole, function (req, res, done) {
        getItemsManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge);
    });
    
    //Set the linked items
    controller.put('/:id/' + sourceRole, function (req, res, done) {
        setItemsManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge, optional);
    });
    
    //Link multiple items - Ids included in the body
    controller.post('/:id/' + sourceRole, function (req, res, done) {
        handleMultipleItems(req, res, sourceName, targetName, sourceRole, targetRole, bridge, false, function (sourceName, targetName, sourceId, targetId, bridge, entity, role, oppositeId, entityName, cb) {
            linkItems(bridge, sourceRole, targetRole, sourceId, targetId, cb);
        });
    });
 
    //Unlink an item - Id included in the url
    controller.delete('/:id/' + sourceRole + '/:' + targetName + 'Id', function (req, res, done) {
        handleSingleItemManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge, optional, unlinkItems);
    });

    controller.query('get', function (req, res, next) {
        if(req.query.populate === sourceRole) {
            populateManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge); 
        }
        else {
            return next();    
        }
    });
}

function buildOneCardinalityApis(controller, sourceName, targetName, sourceRole, targetRole) {
    
    //Retrieves the linked item
    controller.get('/:id/' + sourceRole, function (req, res, done) {
        getItem(req, res, sourceName, targetName, sourceRole);
    });
    
    //Link an item - Id included in the url
    controller.post('/:id/' + sourceRole, function (req, res, done) {
        req.params[targetName + 'Id'] = req.body.id;
        handleSingleItem(req, res, sourceName, targetName, sourceRole, targetRole, false, linkTargetToSource);
    });
    
    //Unlink an item - Id included in the url
    controller.delete('/:id/' + sourceRole + '/:' + targetName + 'Id', function (req, res, done) {
        handleSingleItem(req, res, sourceName, targetName, sourceRole, targetRole, false, unlinkTargetFromSource);
    });
}

function buildManyCardinalityApis(controller, sourceName, targetName, sourceRole, targetRole, singleResult, optional) {
    
    //Retrieves the linked items
    controller.get('/:id/' + sourceRole, function (req, res, done) {
        getItems(req, res, sourceName, targetName, sourceRole, targetRole, singleResult);
    });

    if (optional && !singleResult) {
        //Set the linked items - Ids included in the body
        controller.put('/:id/' + sourceRole, function (req, res, done) {
            unlinkAllTargetsFromSource(req, sourceName, targetName, sourceRole, targetRole, function (err) {
                if (err) {
                    return utilities.error(res, err);
                }
                handleMultipleItems(req, res, sourceName, targetName, sourceRole, targetRole, null, false, function (sourceName, targetName, sourceId, targetId, bridge, entity, role, oppositeId, entityName, cb) {
                    linkTargetToSource(entity, role, oppositeId, entityName, cb);
                });
            });
        });    
    }
    
    //Link multiple items - Ids included in the body
    controller.post('/:id/' + sourceRole, function (req, res, done) {
        handleMultipleItems(req, res, sourceName, targetName, sourceRole, targetRole, null, singleResult, function (sourceName, targetName, sourceId, targetId, bridge, entity, role, oppositeId, entityName, cb) {
            linkTargetToSource(entity, role, oppositeId, entityName, cb);
        });
    });
    
    if (optional) {
        //Unlink an item - Id included in the url
        controller.delete('/:id/' + sourceRole + '/:' + targetName + 'Id', function (req, res, done) {
            handleSingleItem(req, res, sourceName, targetName, sourceRole, targetRole, true, unlinkTargetFromSource);
        });
    }

    controller.query('get', function (req, res, next) {
        if(req.query.populate === sourceRole) {
            populateManyToOne(req, res, sourceName, targetName, sourceRole, targetRole);
        }
        else {
            return next();    
        }
    });
}

module.exports = {
    apply: apply
};

//Helper functions

function getItem(req, res, sourceName, targetName, role) {
    var sourceId = req.params.id;
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        if (source[role]) {
            single(targetName, source[role], function (err, target) {
                if (err) {
                    return utilities.error(res, err);
                }
                return utilities.send(res, target);
            });
        }
        else {
            return utilities.send(res, null);
        }
    });
}

function getItems(req, res, sourceName, targetName, sourceRole, targetRole, singleResult) {
    var sourceId = req.params.id;
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        var query = entityModels[targetName].model.find();
        query.where(targetRole).equals(sourceId);
        query.exec(function (err, items) {
            if (err) {
                return utilities.error(res, err);
            }
            if(singleResult) {
                if(items.length > 0) {
                    return utilities.send(res, items[0]);    
                }
                else {
                    return utilities.send(res, null);
                }
            }
            else {
                return utilities.send(res, items);
            }
        });
    });
}

function getItemsManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge) {
    var sourceId = req.params.id;
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        var query = entityModels[bridge].model.find();
        query.where(targetRole).equals(sourceId);
        query.populate(sourceRole);
        query.exec(function (err, records) {
            if (err) {
                return utilities.error(res, err);
            }
            var results = [];
            records.forEach(function (record) {
                if(record[sourceRole]) {
                    results.push(record[sourceRole]);
                }
            });
            return utilities.send(res, results);
        });
    });
}

function setItemsManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge, optional) {
    var sourceId = req.params.id;
    var targetIds = req.body;
    var targetIndex = targetIds.length;

    if (!targetIndex) {
        targetIds = [];
        targetIndex = 0;
    }
    
    if(!optional && targetIndex === 0) {
        return utilities.send(res, [getRequiredError(sourceRole)], 422);
    }

    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        unlinkAllItems(bridge, targetRole, sourceId, function (err) {
            if (err) {
                return utilities.error(res, err);
            }
            if (targetIndex === 0) {
                return utilities.send(res, source);
            }
            targetIds.forEach(function (targetId) {
                single(targetName, targetId, function (err, target) {
                    if (err) {
                        return utilities.error(res, err);
                    }
                    linkItems(bridge, sourceRole, targetRole, sourceId, targetId, function (err, record) {
                        if (err) {
                            return utilities.error(res, err);
                        }
                        --targetIndex;
                        if (targetIndex === 0) {
                            return utilities.send(res, source);
                        }
                    });
                });
            });
        });
    });
}

function handleMultipleItems(req, res, sourceName, targetName, sourceRole, targetRole, bridge, singleResult, cb) {
    var sourceId = req.params.id;
    var targetIds = req.body;
    if(singleResult) {
        targetIds = [req.body.id];
    }
    var targetIndex = targetIds.length;
    if (!targetIndex) {
        targetIds = [];
        targetIndex = 0;
    }
    
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        if (targetIndex === 0) {
            return utilities.send(res, source);
        }
        targetIds.forEach(function (targetId) {
            single(targetName, targetId, function (err, target) {
                if (err) {
                    return utilities.error(res, err);
                }
                cb(sourceName, targetName, sourceId, targetId, bridge, target, targetRole, sourceId, targetName, function (err, linkedTarget) {
                    if (err) {
                        return utilities.error(res, err);
                    }
                    --targetIndex;
                    if (targetIndex === 0) {
                        return utilities.send(res, source);
                    }
                });
            });
        });
    });
}

function handleSingleItem(req, res, sourceName, targetName, sourceRole, targetRole, inverse, cb) {
    var sourceId = req.params.id;
    var targetId = req.params[targetName + 'Id'];
    retrieveEntities(sourceName, targetName, sourceId, targetId, function (err, source, target) {
        if (err) {
            return utilities.error(res, err);
        }

        var entity = source;
        var role = sourceRole;
        var id = targetId;
        var entityName = sourceName;

        if (inverse) {
            entity = target;
            role = targetRole;
            id = sourceId;
            entityName = targetName;
        }

        cb(entity, role, id, entityName, function (err, linkedItem) {
            if (err) {
                return utilities.error(res, err);
            }
            return utilities.send(res, source);
        });
    });
}

function handleSingleItemManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge, optional, cb) {
    var sourceId = req.params.id;
    var targetId = req.params[targetName + 'Id'];
    retrieveEntities(sourceName, targetName, sourceId, targetId, function (err, source, target) {
        if (err) {
            return utilities.error(res, err);
        }
        
        var query = entityModels[bridge].model.find();
        query.where(targetRole).equals(sourceId);
        query.exec(function (err, records) {
            if (err) {
                return utilities.error(res, err);
            }
            if(!optional && records.length <= 1) {
                return utilities.send(res, [getRequiredError(sourceRole)], 422);
            }
            else {
                cb(bridge, sourceRole, targetRole, sourceId, targetId, function (err, record) {
                    if (err) {
                        return utilities.error(res, err);
                    }
                    return utilities.send(res, source);
                });
            }
        });
    });
}

function retrieveEntities(sourceName, targetName, sourceId, targetId, cb) {
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return cb(err);
        }
        single(targetName, targetId, function (err, target) {
            if (err) {
                return cb(err);
            }
            return cb(null, source, target);
        });
    });
}

function single(entityName, id, cb) {
    find(entityName, id, function (err, obj) {
        if (err) {
            return cb(err, null);
        }
        if (!obj) {
            return cb(utilities.notFoundException(entityName, id), null);
        }
        return cb(null, obj);
    });
}
function find(entityName, id, cb) {
    entityModels[entityName].model.findOne({ '_id': id }).exec(function (err, category) {
        if (err) {
            return cb(err, null);
        }
        return cb(null, category);
    });
}
function unlinkAllItems(bridge, entityRole, id, cb) {
    var query = entityModels[bridge].model.findOne();
    query.where(entityRole).equals(id);
    query.remove(function (err) {
        if (err) {
            return cb(err);
        }
        return cb(null);
    });
}
function linkItems(bridge, sourceRole, targetRole, sourceId, targetId, cb) {
    var query = entityModels[bridge].model.findOne();
    query.where(sourceRole).equals(targetId);
    query.where(targetRole).equals(sourceId);
    query.exec(function (err, record) {
        if (err) {
            return cb(err);
        }
        if (!record) {
            var entity = {};
            entity[sourceRole] = targetId;
            entity[targetRole] = sourceId;
            entityModels[bridge].model.create(entity, function (err, record) {
                if (err) {
                    return cb(err, null);
                }
                return cb(null, record);
            });
        }
        else {
            return cb(null, record);
        }
    });
}
function unlinkItems(bridge, sourceRole, targetRole, sourceId, targetId, cb) {
    var query = entityModels[bridge].model.findOne();
    query.where(sourceRole).equals(targetId);
    query.where(targetRole).equals(sourceId);
    query.remove(function (err) {
        if (err) {
            return cb(err);
        }
        return cb(null);
    });
}

function linkTargetToSource(source, role, targetId, sourceName, cb) {
    source[role] = targetId;
    source.save(function (err, data) {
        if (err) {
            return cb(err, null);
        }
        return cb(null, data);
    });
}

function unlinkTargetFromSource(source, role, targetId, sourceName, cb) {
    if (String(source[role]) === String(targetId)) {
        source[role] = null;
        source.save(function (err, data) {
            if (err) {
                return cb(err, null);
            }
            return cb(null, data);
        });
    }
    else {
        return cb(utilities.notFoundException(sourceName + '.' + role, targetId), null);
    }
}

function unlinkAllTargetsFromSource(req, sourceName, targetName, sourceRole, targetRole, cb) {
    var sourceId = req.params.id;
    var query = entityModels[targetName].model.find();
    query.where(targetRole).equals(sourceId);
    query.exec(function (err, items) {
        if (err) {
            return cb(err);
        }
        var itemIndex = items.length;
        if (itemIndex === 0) {
            return cb();
        }
        items.forEach(function (item) {
            item[targetRole] = null;
            item.save(function (err, data) {
                if (err) {
                    return cb(err);
                }
                --itemIndex;
                if (itemIndex === 0) {
                    return cb();
                }
            });
        });
    });
}

function populateManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge) {
    req.baucis.query.exec(function (err, docs) {
        if (err) {
            return utilities.error(res, err);
        }

        var isArray = docs instanceof Array;        
        var objects = [];
        if(isArray) {
            objects = docs;
        }
        else {
            objects.push(docs);
        }
        
        var objectsCount =  objects.length;
        if(objectsCount === 0) {
            res.status(200)
            .type('application/json')
            .send(docs)
            .end();  
            return;	
        }
        
        var populateRecords = function (err, records) {
            if (err) {
                return utilities.error(res, err);
            }
            if (records.length > 0) {
                var results = [];
                records.forEach(function (record) {
                    if (record[sourceRole]) {
                        results.push(record[sourceRole]);
                    }
                });

                if (results.length > 0) {
                    for (var k = 0; k < objects.length; k++) {
                        var element = objects[k];
                        if (element._id.toString() === records[0][targetRole].toString()) {
                            var newElement = JSON.parse(JSON.stringify(element));
                            newElement[sourceRole] = results;
                            objects[k] = newElement;
                            break;
                        }
                    }
                }
            }

            objectsCount--;
            if (objectsCount === 0) {
                res.status(200)
                    .type('application/json')
                    .send(isArray ? objects : objects[0])
                    .end();
                return;
            }
        };
        
        for (var i = 0; i < objects.length; i++) {
            var query = entityModels[bridge].model.find();
            query.where(targetRole).equals(objects[i]._id);
            query.populate(sourceRole);
            query.exec(populateRecords);
        }
    });
}

function populateManyToOne(req, res, sourceName, targetName, sourceRole, targetRole) {
    req.baucis.query.exec(function (err, docs) {
        if (err) {
            return utilities.error(res, err);
        }
        
        var isArray = docs instanceof Array;
        var objects = [];
        if(isArray) {
            objects = docs;
        }
        else {
            objects.push(docs);
        }
        
        var objectsCount =  objects.length;
        if(objectsCount === 0) {
            res.status(200)
            .type('application/json')
            .send(docs)
            .end();  
            return;	
        }
        
        var populateRecords = function (err, records) {
            if (err) {
                return utilities.error(res, err);
            }
            if (records.length > 0) {
                for (var k = 0; k < objects.length; k++) {
                    var element = objects[k];
                    if (element._id.toString() === records[0][targetRole].toString()) {
                        var newElement = JSON.parse(JSON.stringify(element));
                        newElement[sourceRole] = records;
                        objects[k] = newElement;
                        break;
                    }
                }
            }

            objectsCount--;
            if (objectsCount === 0) {
                res.status(200)
                    .type('application/json')
                    .send(isArray ? objects : objects[0])
                    .end();
                return;
            }
        };
        
        for (var i = 0; i < objects.length; i++) {
            var query = entityModels[targetName].model.find();
            query.where(targetRole).equals(objects[i]._id);
            query.exec(populateRecords);
        }
    }); 
}

function buildManyRoleApis(controller, manyRoles) {
    if (hasNonOptionalRoles(manyRoles)) {
        controller.request('post', function (req, res, next) {
            var obj = req.body;
            var attachedRoles = getttachedRoles(obj, manyRoles);

            var errors = [];
            for (var i = 0; i < manyRoles.length; i++) {
                var role = manyRoles[i];
                if (!role.optional && attachedRoles.indexOf(role) === -1) {
                    errors.push(getRequiredError(role.sourceRole));
                }
            }

            if (errors.length !== 0) {
                return utilities.send(res, errors, 422);
            }
            else {
                return next();
            }
        });
    }
    
    controller.query('post', function (req, res, next) {
        var obj = req.body;
        var attachedRoles = getttachedRoles(obj, manyRoles);
        if (attachedRoles.length === 0) {
            return next();
        }
        
        req.baucis.query.exec(function (err, docs) {
            var doc = docs[0];
            if (err || !doc) {
                return utilities.error(res, err);
            }

            var jsonDoc = JSON.parse(JSON.stringify(doc));
            var rolesIndex = attachedRoles.length;
            attachedRoles.forEach(function (role) {
                var targetIds = getArrayValue(obj, role.sourceRole);
                var targetIndex = targetIds.length;
                var firstTarget = true;

                var sendResult = function (err, record) {
                    if (err) {
                        return utilities.error(res, err);
                    }
                    --targetIndex;
                    if (firstTarget) {
                        --rolesIndex;
                        firstTarget = false;
                    }
                    jsonDoc[role.sourceRole] = targetIds;
                    if (targetIndex === 0 && rolesIndex === 0) {
                        return utilities.send(res, jsonDoc, 201);
                    }
                };
                targetIds.forEach(function (targetId) {
                    single(role.targetClass, targetId, function (err, target) {
                        if (err) {
                            return utilities.error(res, err);
                        }
                        
                        if (role.bridge) { // Many to Many
                            linkItems(role.bridge, role.sourceRole, role.targetRole, doc._id, targetId, sendResult);
                        }
                        else { // Many to One 
                            linkTargetToSource(target, role.targetRole, doc._id, null, sendResult);
                        }
                    });
                });
            });
        });
    });
}

function validateDeleteRequest(controller, relatedRoles, className) {
    controller.request('delete', function (req, res, next) {
        var rolesIndex = relatedRoles.length;
        var errors = [];
        var validate = function (err, items) {
            if (items && items.length > 0) {
                var ids = getIds(items);
                errors.push({
                    name: 'CardinalityConstraintViolated',
                    template: 'Cannot delete this {cl}. Please remove its related {relatedClass}(s) first.',
                    params: {
                        cl: className,
                        id: req.params.id,
                        relatedClass: role.relatedClass,
                        relatedIds: ids.join()
                    }
                });
            }
            --rolesIndex;
            if (rolesIndex === 0) {
                if (errors.length === 0) {
                    return next();
                }
                else {
                    return utilities.send(res, errors, 409);
                }
            }
        };
        for (var i = 0; i < relatedRoles.length; i++) {
            var role = relatedRoles[i];
            var query = entityModels[role.table].model.find();
            query.where(role.column).equals(req.params.id);
            query.exec(validate);
        }
    });
}

function validateRequiredCompositeRoles(controller, roles, className) {
    controller.request('post put', function (req, res, next) {
        var obj = req.body;
        var errors = [];
        roles.forEach(function (role) {
            if (getArrayValue(obj, role) === undefined) {
                errors.push(getRequiredError(role));
            }
        });
        
        if (errors.length !== 0) {
            return utilities.send(res, errors, 422);
        }
        else {
            return next();
        }
    });
}

function getManyRoles(className) {
    var roles = [];
    metamodel.associations.forEach(function (association) {
        if (association.composition) {
            return;
        }
        if (className === association.aClass && association.isSourceMultiple()) {
            roles.push({
                sourceClass: className,
                targetClass: association.bClass,
                sourceRole: association.aRole,
                targetRole: association.bRole,
                optional: association.isSourceOptional(),
                bridge: association.isTargetMultiple() ? association.name : undefined
            });
        }
        if (className === association.bClass && association.isTargetMultiple()) {
            roles.push({
                sourceClass: className,
                targetClass: association.aClass,
                sourceRole: association.bRole,
                targetRole: association.aRole,
                optional: association.isTargetOptional(),
                bridge: association.isSourceMultiple() ? association.name : undefined
            });
        }
    });
    return roles;
}

function getArrayValue(obj, role) {
    var value = obj[role];
    if (value && value instanceof Array && value.length > 0) {
        return value;
    }
    else {
        return undefined;
    }
}

function getttachedRoles(obj, roles) {
    var attachedRoles = [];
    roles.forEach(function (role) {
        if (getArrayValue(obj, role.sourceRole)) {
            attachedRoles.push(role);
        }
    });
    return attachedRoles;
}

function hasNonOptionalRoles(roles) {
    for (var i = 0; i < roles.length; i++) {
        if (!roles[i].optional) {
            return true;
        }
    }
    return false;
}

function getRelatedRoles(className) {
    var roles = [];
    metamodel.associations.forEach(function (association) {
        if (association.composition) {
            return;
        }
        if (className === association.aClass) {
            if(!association.isTargetMultiple() && !isChildClass(association.bClass)) {
                roles.push({
                    table: association.bClass,
                    relatedClass: association.bClass,
                    column: association.bRole
                });
            }
        }
        if (className === association.bClass) {
            if(!association.isSourceMultiple() && !isChildClass(association.aClass)) {
                roles.push({
                    table: association.aClass,
                    relatedClass: association.aClass,
                    column: association.aRole
                });
            }
        }
    });
    return roles;
}

function isChildClass(className) {
    for (var i = 0; i < metamodel.associations.length; i++) {
        var association = metamodel.associations[i];
        if (association.composition && association.bClass === className) {
            return true;
        }
    }
    return false;
}

function getRequiredCompositeRoles(className) {
    var roles = [];
    metamodel.associations.forEach(function (association) {
        if (className === association.aClass && association.composition && !association.isSourceOptional()) {
            roles.push(association.aRole);
        }
    });
    
    return roles;
}

function buildHalForRelations(controller, halRoles) {
    controller.request(function (req, res, next) {
        req.baucis.outgoing(es.through(function (context) {
            buildHalLinks(context, halRoles);
            this.queue(context);
        }));
        next();
    });
}

function buildHalLinks(context, halRoles) {
    if(!context || !context.doc || !context.doc._doc) {
        return;
    }
    if (!context.doc._doc._links) {
        context.doc._doc._links = {};
    }
    for (var i = 0; i < halRoles.length; i++) {
        var value = replaceIds(halRoles[i].value, context.doc._doc._id);
        context.doc._doc._links[halRoles[i].key] = value;
    }
}

function replaceIds(array, id) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
        var element = utilities.clone(array[i]);
        if(element.href) {
            element.href = element.href.replace("{id}", id);
        }
        result.push(element);
    }
    
    return result;
}

function getHalRoles(className) {
    var roles = [];
    var models = entityModels[className];
    if (models && models.model) {
        var path = models.model.plural();
        metamodel.associations.forEach(function (association) {
            if (association.composition) {
                return;
            }
            if (className === association.aClass) {
                roles.push(getHalRolesforAssociation(path, association.aClass, association.bClass, association.aRole, association.bRole, association.isSourceOptional(), association.isTargetOptional(), association.isSourceMultiple(), association.isTargetMultiple()));
            }
            if (className === association.bClass) {
                roles.push(getHalRolesforAssociation(path, association.bClass, association.aClass, association.bRole, association.aRole, association.isTargetOptional(), association.isSourceOptional(), association.isTargetMultiple(), association.isSourceMultiple()));
            }
        });
    }
    return roles;
}

function getHalRolesforAssociation(path, sourceName, targetName, sourceRole, targetRole, sourceOptional, targetOptional, sourceMultiple, targetMultiple) {
    var result = { key: sourceRole };
    if (sourceMultiple && targetMultiple) { // [Many to Many]
        result.value = getHalRolesforManyToMany(path, targetName, sourceRole);
    }
    else if (!sourceMultiple && !targetMultiple) { // [One to One]
        if (sourceOptional) {
            result.value = getHalRolesforMany(path, targetName, sourceRole, true, targetOptional);
        }
        else {
            result.value = getHalRolesforOne(path, targetName, sourceRole);
        }
    }
    else { // [One to Many], [Many to One]
        if (sourceMultiple) {
            result.value = getHalRolesforMany(path, targetName, sourceRole, false, targetOptional);
        }
        else {
            result.value = getHalRolesforOne(path, targetName, sourceRole);
        }
    }
    return result;
}

function getHalRolesforMany(path, sourceRole, targetName, singleResult, optional) {
    var result = [
        {
            href: '/api/' + path + '/{id}/' + sourceRole
        }
    ];

    if (optional && !singleResult) {
        result.push({
            verb: 'PUT',
            href: '/api/' + path + '/{id}/' + sourceRole
        });
    }

    result.push({
        verb: 'POST',
        href: '/api/' + path + '/{id}/' + sourceRole
    });

    if (optional) {
        result.push({
            verb: 'DELETE',
            href: '/api/' + path + '/{id}/' + sourceRole + '/{' + targetName + 'Id}',
            templated: true
        });
    }

    return result;
}

function getHalRolesforOne(path, targetName, sourceRole) {
    return [
        {
            href: '/api/' + path + '/{id}/' + sourceRole
        },
        {
            verb: 'POST',
            href: '/api/' + path + '/{id}/' + sourceRole
        },
        {
            verb: 'DELETE',
            href: '/api/' + path + '/{id}/' + sourceRole + '/{' + targetName + 'Id}',
            templated: true
        }
    ];
}

function getHalRolesforManyToMany(path, targetName, sourceRole) {
    return [
        {
            href: '/api/' + path + '/{id}/' + sourceRole
        },
        {
            verb: 'PUT',
            href: '/api/' + path + '/{id}/' + sourceRole
        },
        {
            verb: 'POST',
            href: '/api/' + path + '/{id}/' + sourceRole
        },
        {
            verb: 'DELETE',
            href: '/api/' + path + '/{id}/' + sourceRole + '/{' + targetName + 'Id}',
            templated: true
        }
    ];
}
        
function getRequiredError(role) {
    return {
        "message": "Path `" + role + "` is required.",
        "name": "ValidatorError",
        "kind": "required",
        "path": role
    };
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

function getIds(items) {
    var ids = [];
    for (var i = 0; i < items.length; i++) {
        ids.push(items[i]._id);
    }
    return ids;
}