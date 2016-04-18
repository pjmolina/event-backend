// plugin-101
// Sample plug-in skeleton to extend hivepod functionality.
// A set of functions will be called in this order:
/*
	configure
	extendModel
	extendMongoose
	extendBaucis
	extendSwagger2
	extendExpress
	extendAuth
*/

//Current configuration for current environment will be passed here
//A chance is provided to read configuration or to extend it
//Options for plugin are passed here as options
function configure(configuration, options) {	
	console.log("  plugin- configure()");	
}

//Hook to extend or change the metamodel of the app
function extendModel(metamodel, options) {	
	console.log("  plugin- extendModel()");	
}

//Hook to extend or change the Mongoose models
function extendMongoose(models, options) {	
	console.log("  plugin- extendMongoose()");	
}

//Hook to extend or change baucis rest controllers 
function extendBaucis(baucisInstance, options) {	
	console.log("  plugin- extendBaucis()");	
}

//Hook to extend or change exposed Swagger API docs 
function extendSwagger2(baucisInstance, sw2Root, options) {	
	console.log("  plugin- extendSwagger2()");	
}

//Hook to extend or change the express middleware 
function extendExpress(app, options) {	
	console.log("  plugin- extendExpress()");
}

//Hook to extend or change the authentication or authorization middlewares 
function extendAuth(authn, authz, passport, options) {	
	console.log("  plugin- extendAuth()");	
}

module.exports = {
	//metadata ---
	name: 'plugin-sample-101', 
	contractVersion: 'pod-plugin-1.0',
	author: 'pjmolina',

	//interface ---	
	configure : configure,
	extendModel : extendModel,
	extendMongoose : extendMongoose,
	extendBaucis : extendBaucis,
	extendSwagger2 : extendSwagger2,
	extendExpress : extendExpress,
	extendAuth : extendAuth	
};