//plugin mananger -- Dinamically loads Pod plugins
/*eslint no-unused-vars: 0*/

var plugins = [];

function registerIfPressent(pluginsConfPath) {
    var pluginConf = loadModule('../' + pluginsConfPath);
    if(pluginConf && pluginConf.getPluginsConfigurations) {
        console.log('Plugins configuration found, applying it.');
        register(pluginConf.getPluginsConfigurations());
    } else {
        console.log('No plugin configuration found. No plugins will be loaded');
    } 
}

function register(pluginsConf) {
	if (!pluginsConf) {
		return;
	}	
	pluginsConf.forEach(function(item) {
		registerPlugin(item.name, item.options);	
	});
}

function registerPlugin(pluginName, options) {
	try {
		var plugin = loadModule('../plugins/' + pluginName); //dynamically load the plugin from the local code

		if (!plugin) {
			plugin = loadModule(pluginName); //dynamically load the plugin from the node modules
		}

		if (!plugin) {
			console.error('Can not load plugin: ' + pluginName +'. The plugin not found in the plugins folder nor node modules folder.');
			return;
		}

		if (plugin.name && plugin.contractVersion) {
			console.log('Loading plugin: ' + plugin.name + ' ' + plugin.contractVersion + ' by ' + plugin.author);
		}
		else {
			console.error('Skiping ' + pluginName + '. Do not satisfy the plugin contract.');
			return;
		}

		console.log('Plugin: ' + plugin.name + ' loaded.');

		plugins.push({instance: plugin, options: options});
	}
	catch (err) {
		console.error('Error in plugin: ' + pluginName + '. Error details: ' + err);
	}
}

function extendConfigurations(configuration) {
	plugins.forEach(function(plugin) {
		if (plugin.instance.extendModel) {
			plugin.instance.configure(configuration, plugin.options);
		}
	});
}

function extendModel(metamodel) {
	plugins.forEach(function(plugin) {
		if (plugin.instance.extendModel) {
			plugin.instance.extendModel(metamodel, plugin.options);
		}
	});
}

function extendMongoose(models) {
	plugins.forEach(function(plugin) {
		if (plugin.instance.extendMongoose) {
			plugin.instance.extendMongoose(models, plugin.options);
		}
	});
}

function extendBaucis(baucisInstance) {
	plugins.forEach(function(plugin) {
		if (plugin.instance.extendBaucis) {
			plugin.instance.extendBaucis(baucisInstance, plugin.options);
		}
	});
}

function extendSwagger2(baucisInstance) {
	plugins.forEach(function(plugin) {
		if (plugin.instance.extendSwagger2) {
			plugin.instance.extendSwagger2(baucisInstance, baucisInstance.swagger2Document, plugin.options);
		}
	});
}

function extendExpress(app) {
	plugins.forEach(function(plugin) {
		if (plugin.instance.extendExpress) {
			plugin.instance.extendExpress(app, plugin.options);
		}
	});
}

function extendAuth(authn, authz, passport) {
	plugins.forEach(function(plugin) {
		if (plugin.instance.extendModel) {
			plugin.instance.extendAuth(authn, authz, passport, plugin.options);
		}
	});
}

function loadModule(pluginPath) {
	var plugin;
	try {
		plugin = require(pluginPath); 
	} catch (error) {
		// do nothing - Module not found 
	}
	return plugin;
}

module.exports = {
    register : register,
    registerIfPressent: registerIfPressent,
    extendConfigurations: extendConfigurations,
    extendModel: extendModel,
    extendMongoose: extendMongoose,
    extendBaucis: extendBaucis,
    extendSwagger2: extendSwagger2,
    extendExpress: extendExpress,
    extendAuth: extendAuth,
	plugins : plugins
};