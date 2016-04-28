function getPluginsConfigurations() {
    //Register an array of plugins
    //var plugins = [];

    /* Example: 
    var plugins = [
        {
            name: 'plugin-101'
        },
        {
            name: 'replace-ui-file', 
            options:
            {
                '/i18n/literals.en-US.json': '/i18n/literals.es-ES.json' //Replace the English translation with the Spanish translation
            }
        }
    ];
    */
    var plugins = [
        {
            name: "prometheus-collector",
            options: {}
        },
        {
            name: "consul-autoregister",
            options: {
                //host: "192.168.99.1"
                //consul: "consul"
            }
        }      		      		
    ];

    return plugins;
}

module.exports.getPluginsConfigurations = getPluginsConfigurations;