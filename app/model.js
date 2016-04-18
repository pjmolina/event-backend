//Data model for Backend-Services  ---------------
/*eslint no-unused-vars: 0 */

var conf = require('./conf/configuration').getConfiguration();
var mongoose = require('mongoose');
var geojson = require('mongoose-geojson');
var crypto = require('crypto');
var bcrypt  = require('bcrypt-nodejs');

var ObjectId = mongoose.Schema.Types.ObjectId;

// Create Mongoose schemas
var PlaceSchema = new mongoose.Schema({
 	_ownerId: { type: String, required: false, index: true },			//userId to enforce security policies
  	_createdAt: { type: Date, required: false, default: Date.now },		//object creation date
	name: { type: String, required: true },
	address: { type: String, required: false },
	city: { type: String, required: false },
	zipCode: { type: Number, required: false },
	image: { type: String, required: false }
});


geojson(PlaceSchema, {
  type: 'Point',
  path: 'location',
  required: true
});

PlaceSchema.index({'location': '2dsphere'});

var SessionTalkSchema = new mongoose.Schema({
 	_ownerId: { type: String, required: false, index: true },			//userId to enforce security policies
  	_createdAt: { type: Date, required: false, default: Date.now },		//object creation date
	sessionType: { type: String, required: true },
	name: { type: String, required: true },
	track: { type: Number, required: true },
	language: { type: String, required: true },
	starts: { type: Date, required: false },
	ends: { type: Date, required: false },
	description: { type: String, required: false },
	speaker: { type: ObjectId, required: false, ref: 'speaker' } /* Reference */
});

var SpeakerSchema = new mongoose.Schema({
 	_ownerId: { type: String, required: false, index: true },			//userId to enforce security policies
  	_createdAt: { type: Date, required: false, default: Date.now },		//object creation date
	name: { type: String, required: true },
	surname: { type: String, required: true },
	photo: { type: String, required: false },
	blog: { type: String, required: false },
	twitter: { type: String, required: false },
	linkedin: { type: String, required: false },
	github: { type: String, required: false },
	bio: { type: String, required: false }
});

var SponsorSchema = new mongoose.Schema({
 	_ownerId: { type: String, required: false, index: true },			//userId to enforce security policies
  	_createdAt: { type: Date, required: false, default: Date.now },		//object creation date
	name: { type: String, required: true },
	level: { type: String, required: true },
	logo: { type: String, required: true }
});


//Many To Many -----

//Internal setting -----
var ConfigSchemaInternal = new mongoose.Schema({ 
    key: { type: String, required: true },
    value: { type: String, required: false }
})
.index({ key : 1 }, { unique: true });

var WebParameterSchemaInternal = new mongoose.Schema({ 
    type:  { type: String, required: true },
    key:   { type: String, required: true },
    value: { type: String, required: false }
});

var WebhooksSchemaInternal = new mongoose.Schema({
    enabled: { type: Boolean, required: true }, 
    resource: { type: String, required: true },
    operation: { type: String, required: true },
    httpMethod: { type: String, required: true },
    urlTemplate: { type: String, required: true },
    parameters: [ WebParameterSchemaInternal ],
    contentType: { type: String, required: false },
    bodyTemplate: { type: String, required: false }
});

var UserSchemaInternal = new mongoose.Schema({ 
    accountType: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: false, set: generateHash }, // salted
    token: { type: String, required: false, get: encryptField, set: decryptField },
    createdAt: { type: Date, required: true, default: Date.now },
    lastAccessOn: { type: Date, required: false },
    enabled: { type: Boolean, required: true },
    role: { type: String, required: true },
    description: { type: String, required: false }
})
.index({ accountType: 1, username : 1 }, { unique: true });

var PermissionsSchemaInternal = new mongoose.Schema({ 
    role: { type: String, required: true },
    resource: { type: String, required: true },
    operations: {
        allow: [String],
        deny: [String]
    },
    horizontalSecurity: {
        type: {type: String, required: false }
    },
    fields: {
        allow: [String],
        deny: [String]
    }
})
.index({ role : 1, resource: 1 }, {unique : true});

var IdentityProviderSchemaInternal = new mongoose.Schema({ 
    name: { type: String, required: true },
    enable: { type: Boolean, required: true },
    autoEnroll: { type: Boolean, required: true },
    defaultRole: { type: String, required: false },
    order: { type: Number, required: true }
});

//Create full text indexes (experimental)--- Uncomment only as needed
/*
    PlaceSchema.index({
    	name: 'text',
		address: 'text',
		city: 'text'    
    });
    SessionTalkSchema.index({
    	sessionType: 'text',
		name: 'text',
		language: 'text',
		description: 'text'    
    });
    SpeakerSchema.index({
    	name: 'text',
		surname: 'text',
		blog: 'text',
		twitter: 'text',
		linkedin: 'text',
		github: 'text',
		bio: 'text'    
    });
    SponsorSchema.index({
    	name: 'text',
		level: 'text'    
    });
*/

// password hashing  ======================
// generating a hash with salt
function generateHash(password) {
    var salted = null;
    if (isAlreadyHashed(password)) {
        //inject as is: already salted
        salted = password;
    }
    else {        
        //salt password
        salted = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    }
    return salted;
}

function isAlreadyHashed(password) {
    //bcrypt hashes starts with $2a$ follow by two chars with the size of the salt in bytes
    return (password && password.substring(0, 4) === "$2a$");
}

function checkPassword(plain, hashed) {
   return bcrypt.compareSync(plain, hashed);
}


//--- Symetric Encryption  
var cryptProtocolPrefix = "_#cryp0:";  //do not change <- constant

function decryptField(text){
    if (text === null || typeof text === 'undefined') {
        return text;
    }
    if (!startsWith(text, cryptProtocolPrefix)) {
        return text; //stored as plain text
    }

    var inputData = text.substr(cryptProtocolPrefix.length);  //retrieve payload
    return decrypt2(inputData);
}

function encryptField(text){
    if (text === null || typeof text === 'undefined') {
        return text;
    }
    if (startsWith(text, cryptProtocolPrefix)) {
        return text; //alredy encrypted
    }
    return cryptProtocolPrefix + encrypt2(text);  //encrypt always
} 

function startsWith(str, substrTarget){
    if (str === null) {
        return false;
    }
    var res = str.substr(0, substrTarget.length) == substrTarget;
    return res;
}

//AES Cryp function AES-256-CBC
function encrypt2(text){
    var cipher = crypto.createCipher('aes-256-cbc', conf.security.serverSecret);
    var crypted = cipher.update(text,'utf8','base64');
    crypted += cipher.final('base64');
    return crypted;
} 

function decrypt2(text){
    if (text === null || typeof text === 'undefined') {
        return text;
    }
    var decipher = crypto.createDecipher('aes-256-cbc', conf.security.serverSecret);
    var dec = decipher.update(text,'base64','utf8');
    dec += decipher.final('utf8');
    return dec;
}

//Mongoose Extensions -------   
UserSchemaInternal.methods.checkPassword = function (candidate) {
    var obj = this;
    if (isAlreadyHashed(obj.password)) {
        return checkPassword(candidate, obj.password);  //hash
    }
    //direct check (if not salted)
    return obj.password === candidate;
};


// Sample to inject operations into mongoose schemas
//UserSchema.pre('save', function (next) {
//  console.log('A User was saved to MongoDB: %s.', this.get('firstName'));
//  next();
//});

var propertiesForClass = {
	"place" : ['name', 'location', 'address', 'city', 'zipCode', 'image'],
	"sessionTalk" : ['sessionType', 'name', 'track', 'language', 'starts', 'ends', 'description'],
	"speaker" : ['name', 'surname', 'photo', 'blog', 'twitter', 'linkedin', 'github', 'bio'],
	"sponsor" : ['name', 'level', 'logo']  
};
 
function buildModelAndControllerForSchema(container, entityName, pluralName, schema) {
  container[entityName] = {
    'name': entityName,
    'plural': pluralName,
    'schema': schema,
    'model': buildEntityModel(entityName, pluralName, schema),
    'hasController': true
  };
}

function buildModelForSchema(container, entityName, pluralName, schema) {
  container[entityName] = {
    'name': entityName,
    'plural': pluralName,
    'schema': schema,
    'model': buildEntityModel(entityName, pluralName, schema),
    'hasController': false
  };
}

function buildEntityModel(entityName, pluralName, schema) {
  var entityModel = mongoose.model(entityName, schema);
  entityModel.plural(pluralName);
  return entityModel;
}
function getModelForClass(className) {
  var item = models[className];
  if (item === null) {
    return null;
  }
  return item.model;
}
function getMetadataForClass(className) {
  var item = models[className];
  return item;
}

//Models --------------------------------
var models = {};

buildModelAndControllerForSchema(models, '_config',      'admin-config',      ConfigSchemaInternal);
buildModelAndControllerForSchema(models, '_webhooks',    'admin-webhooks',    WebhooksSchemaInternal);
buildModelAndControllerForSchema(models, '_users',       'admin-users',       UserSchemaInternal);
buildModelAndControllerForSchema(models, '_providers',   'admin-providers',   IdentityProviderSchemaInternal);
buildModelAndControllerForSchema(models, '_permissions', 'admin-permissions', PermissionsSchemaInternal);

// Register the schema and export it
buildModelAndControllerForSchema(models, 'place', 'places', PlaceSchema);
buildModelAndControllerForSchema(models, 'sessionTalk', 'sessionTalks', SessionTalkSchema);
buildModelAndControllerForSchema(models, 'speaker', 'speakers', SpeakerSchema);
buildModelAndControllerForSchema(models, 'sponsor', 'sponsors', SponsorSchema);

// Register the schema and export it
module.exports = {
    models: models,
    getModelForClass: getModelForClass,
    propertiesForClass: propertiesForClass,
    getMetadataForClass: getMetadataForClass
};

