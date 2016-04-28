// ReportSlaMetrics
// Reports metrics to compute the SLA

var os = require('os');
var http = require('http');
var promClient = require('prom-client');
var _options;
var pluginName = "prometheus-collector";

var register = promClient.register;
var Histogram = promClient.histogram;
var Counter = promClient.counter;
var Gauge = promClient.gauge;

//Define metrics
var apiCallCounter = new Counter('api_calls_counter', 'Number of API calls', [ 'code' ]);
var execTimeGauge = new Gauge('api_exec_time_ms_gauge', 'Execution time ms.', [ 'method', 'code' ]);
var statusHistogram = new Histogram('status_code_histogram', 'HTTP Response Histogram', [ 'code' ]);

var load1minGauge = new Gauge('load_average_1min_gauge', 'Load average in the last minute.', [ 'code' ]);
var load5minGauge = new Gauge('load_average_5min_gauge', 'Load average in the last 5 minutes.', [ 'code' ]);
var load15minGauge = new Gauge('load_average_15min_gauge', 'Load average in the last 15 minutes.', [ 'code' ]);
var usedMemoryBytesGauge = new Gauge('memory_used_bytes_gauge', 'Used memory in bytes.', [ 'code' ]);
var freeMemoryBytesGauge = new Gauge('memory_free_bytes_gauge', 'Used memory in bytes.', [ 'code' ]);

//Options for plugig are passed here as options
function configure(configuration, options) {
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
    setTimedMetrics();
	app.use("/api", reportMetricsMiddleware); 

	registerMetricsEndPoint(app);
}

//Hook to extend or change the authontication or authorization middlewares 
function extendAuth(authn, authz, passport, options) {	
}

//-------------------------------------------
function setTimedMetrics() {
    setInterval(function() {
        
        //returns [0,0,0] on windows
        var load = os.loadavg();
        load1minGauge.set(load[0]);
        load5minGauge.set(load[1]);
        load15minGauge.set(load[2]);
        
        var free = os.freemem();
        var usedMem = os.totalmem() - free; 
        usedMemoryBytesGauge.set(usedMem);
        freeMemoryBytesGauge.set(free);
                
    }, 60000); //every 60 secs
}


function registerMetricsEndPoint(app) {
	app.get("/metrics", function(req, res) {
		res.status(200)
           .set('Content-Type', 'text/plain')
           .end(register.metrics());
	});
}

function preMetrics(req) {
	req.sla = {
		metrics: {
			t : Date.now(),
			operation : getOperation(req)
		}
	};
}
function postMetrics(req, res) {
	if (req.sla && req.sla.metrics) {
		var metrics = req.sla.metrics;
		metrics.end = Date.now();
		metrics.ellapsedMs = metrics.end - metrics.t;        
		metrics.result = res.statusCode;
		reportMetrics(metrics);         
	}	
}
function reportMetricsMiddleware(req, res, next) {
	preMetrics(req);
	res.on("finish", function() {
        postMetrics(req, res);
	});            
    next();
}

function getOperation(req) {
    return req.originalUrl;    
}

function reportMetrics(metrics) {
	apiCallCounter.inc( { code: metrics.result });
	execTimeGauge.set ( { method: metrics.operation, code: metrics.result }, metrics.ellapsedMs );
	statusHistogram.labels(metrics.result).observe(metrics.ellapsedMs);

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