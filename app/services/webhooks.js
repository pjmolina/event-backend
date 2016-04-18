var https = require("https");
var http = require("http");
var es = require('event-stream');
var url = require("url");

var models = require('../model').models;
var configModel = models._config.model;
var webhooksModel = models._webhooks.model;


function getResource(fragment) {
	if (fragment[0] === '/') {
		return fragment.substr(1);
	}
}

function translateOperation(httpMethod) {
	if (httpMethod === 'GET') {
		return "Query";
	}
	if (httpMethod === 'PUT') {
		return "Modify";
	}
	if (httpMethod === 'POST') {
		return "Add";
	}
	if (httpMethod === 'DELETE') {
		return "Delete";
	}
	return httpMethod;
}

function executeHookIfAny(resource, operation, context, request, response) {
	//Should run hook?
	var q = {
		resource: resource,
		enabled: true
	};
	if (operation !== '*') {
		q.operation = operation;
	}
	var obj = context.doc;

	webhooksModel.find(q, function(err, docs) {
		for(var i in docs) {
			var hook = docs[i];
				//if found -> call hook
				//console.log("execute hook: " + hook.httpMethod + " "+ hook.urlTemplate);
				//console.log("  data:       " + JSON.stringify(obj));
				invokeHook(hook, obj, request, response);
		}
	});
}

function invokeHook(hook, obj, request, response) {
	var urlTarget = resolveParam(hook.urlTemplate, obj, request, response);
	var body =  resolveParam(hook.bodyTemplate, obj, request, response);
	console.log('Execute hook ' + hook.httpMethod + ' to ' + urlTarget);

	var output ='';
	var uparts = url.parse(urlTarget);

	var payload = body;
	if (!body || body==="") {
		payload = JSON.stringify(obj);	
	} 

	var options = {
			  method: hook.httpMethod,
			  host: uparts.hostname,
			  port: uparts.port || ((uparts.protocol === 'http:')? 80 : 443),
			  path: (uparts.path || '') + (uparts.hash || ''),
		      headers: { 
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}        
	};

	if (hook.httpMethod ==='POST' || hook.httpMethod ==='PUT' ) {
		options.headers['Content-Length'] = Buffer.byteLength(payload, 'utf8');
	}

	injectBasicAuth(hook, options, obj);
	injectHttpHeaders(hook, options, obj);
	injectCookies(hook, options, obj);

	var protocolStack = (uparts.protocol === "http:")? http : https;

	var req2 = protocolStack.request(options, function(resp){
			resp.setEncoding('utf8');
			
			resp.on('data', function(chunk){
			  	output += chunk;
			});
			resp.on('end', function() {
				console.log('Hook response:\n'+ output);
		    });

	}).on("error", function(e){
		console.log("Hook got error: " + e.message);
	});

	if (hook.httpMethod ==='POST' || hook.httpMethod ==='PUT' ) {
		req2.write(payload); 
		console.log('Options:\n' + JSON.stringify(options, null, 2));
		console.log('Body:\n' + payload);
	}
	req2.end();
}

function injectBasicAuth(hook, options, data) {
	var params = hook.parameters.filter(function(item) {
		return item.type === 'basicAuth';
	});
	if (params.length === 0) {
		return;
	}
	var credential = params[0]; //take only the first one (ignore the rest)
	var encodedCredentials = toBase64(
								resolveParam(credential.key, data) + 
								':' + 
								resolveParam(credential.value, data));
	options.headers.Authorization = 'Basic ' + encodedCredentials;
}

function injectHttpHeaders(hook, options, data) {
	var params = hook.parameters.filter(function(item) {
		return item.type === 'header';
	});	
	params.forEach(function(item) {
		options.headers[item.key] = resolveParam(item.value, data);
	});
}
function injectCookies(hook, options, data) {
	var params = hook.parameters.filter(function(item) {
		return item.type === 'cookie';
	});	
	var cookies = '';
	var prefix ='';
	params.forEach(function(item) {
		cookies += prefix + encodeURIComponent(item.key) + '=' + encodeURIComponent(resolveParam(item.value, data));
		prefix='; ';
	});
	options.headers.Cookie = cookies;
}

function toBase64(payload) {
	return new Buffer(payload).toString('base64');
}

var paramRegex = /(\{\s*\w+[\.\w+]*\s*\})/g;

function resolveParam(template, obj) {
	if (!template) {
		return template;
	}
	var result = template.replace(paramRegex, function(match, p1, offset, fullString) {
		var prop = p1.substring(1, p1.length-1).trim();
		return obj[prop];
	});
	return result;
}

function applyController(controller) {
	controller.query(function (request, response, next) {
		if (request.method === 'GET') {
			next();
			return;
		}

		//are hooks enabled?
		var query = configModel.where({ 
			'key': 'webhooks.enable'
		});
		query.findOne(function(err, doc) {
			if (doc !== null && doc.value === 'true') {
				
				request.baucis.outgoing(es.through(function (context) {

					executeHookIfAny(getResource(request.baucis.controller.fragment()),
									 translateOperation(request.method), 
									 context, 
									 request,
									 response);	

				    this.queue(context);
				}));
			}
			next();
		});
	});
}

function apply(controllers) {
    controllers.forEach(function(ctl) { 
        applyController(ctl); 
    });
}

module.exports.apply = apply;