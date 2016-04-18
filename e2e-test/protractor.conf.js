exports.config = {
	allScriptsTimeout: 11000,
	specs: [ '*.js' ],
	baseUrl: 'http://localhost:5000',
	framework: 'jasmine',

	multiCapabilities: [
		//{ 'browserName': 'phantomjs' }, 
		{ 'browserName': 'chrome' },
		{ 'browserName': 'firefox'  }
	],

	jasmineNodeOpts: {
	    defaultTimeoutInterval: 30000
	}   
};