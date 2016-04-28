// Consul autoregistration

var consul = require('consul');
var consulInstance;
var _options;
var _conf;
var pluginName = "consul-autoregister";

//Options for plugig are passed here as options
function configure(configuration, options) {
    _conf = configuration;
    _options = options;
    console.log(pluginName + "  module initialized. Server: " + _options.host + ":" + _options.port);
}

//Hook to extend or change the metamodel of the app
function extendModel(metamodel, options) {	
}

//Hook to extend or change the Mongoose models
function extendMongoose(models, options) {	
}

//Hook to extend or change baucis rest controllers 
function extendBaucis(baucisInstance, options) {	
}

//Hook to extend or change exposed Swagger API docs 
function extendSwagger2(baucisInstance, sw2Root, options) {	
}

//Hook to extend or change the expres middleware 
function extendExpress(app, options) {	
    register(app, options);
}

//Hook to extend or change the authontication or authorization middlewares 
function extendAuth(authn, authz, passport, options) {	
}
//-------------------------------------------


var os = require('os');
var ifaces = os.networkInterfaces();

function ips() {
    var firstIp = null;
    
    Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;
        }

        if (alias >= 1) {
            // this single interface has multiple ipv4 addresses
            console.log(ifname + ':' + alias, iface.address);
        } else {
            // this interface has only one ipv4 adress
            console.log(ifname, iface.address);
        }
        if (!firstIp) {
            firstIp = iface.address;
        }
        ++alias;
    });
    });
    return firstIp;
}

function register(app, options) {
    var ip = ips();
    
    var opt = {
        host : options.consul || "consul",
        port : options.consulPort || 8500        
    };
    
    console.log("Consul on: " + opt.host +":" + opt.port);
    
    consulInstance = consul(opt);
    var consultHost = opt.host;
    var address = ip || options.host || _conf.appHost;

    console.log("Service on: " + address +":" + _conf.appPort);
    
    var data = {
        name : _conf.serviceName,
        tags : ["hivepod", "microservice", "nodejs"],
        address : address,
        port : Number(_conf.appPort),
        check: {
            http: "http://" + address + ":" + _conf.appPort + "/ping",
            interval: "30s",
            notes: "Ping service returns pong if accesible."            
        }
    };
    
    console.log("Registering in consul: " + JSON.stringify(data, null, 2));
    
    consulInstance.agent.service.register(data, function(err) {
        if (err) {
            console.error("consul-registration-error: " + JSON.stringify(err));
        }
        else {
            console.log("consul-registration at " + consultHost + " Service: " + data.name + " at http://" + data.address + ":" + data.port + " with check: " + data.check.http);
        }
    });
}

function deregister() {
    var serviceName = _conf.serviceName;
    consulInstance.agent.service.deregister(serviceName, function(err) {
        if (err) {
            console.error("consul-deregistration: " + err);
        } 
        else {
            console.log("consul-deregistration: " + serviceName + " deregistered.");            
        }
    });
}



module.exports = {
	//metadata ---
	name: pluginName, 
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