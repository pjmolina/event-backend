// __Dependencies__
var mongoose = require('mongoose');
var express = require('express');
var baucis = require('baucis');
var compression = require('compression');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var config = require('./config');
var models = require('../../../app/model');

// __Private Module Members__
var app;
var server;

// __Module Definition__
var fixture = module.exports = {
    init: function (done) {
		var dbCnx = (process.env.DB_SERVER) 
				? "mongodb://"+process.env.DB_SERVER+"/eventBackendTest"  //DB passed from event var.
				: config.mongo.url; //Local config

		//mongoose.connect(dbCnx);
		mongoose.createConnection(dbCnx);
        
        app = express();

        //Configure app ------------------------------------
        app.use(compression({
            threshold: 512
        }));
        app.use(bodyParser.urlencoded({
            extended: true,
            limit: '50mb'
        }));
        app.use(bodyParser.json({
            limit: '50mb'
        }));
        app.use(cookieParser());

        // Create the API routes & controllers  ---------------------------
        fixture.controllers = [];
        Object.keys(models.models).forEach(function (key) {
            var item = models.models[key];
            var controller = baucis.rest(item.name, item.model).hints(true).comments(true);
            item.controller = controller;
            fixture.controllers.push(controller);
        });

        //Add domain services -----------------------------------------------
        require('../../../app/services/relationsHooks').apply(models);
        //---------------------------------------------------------------------

        var baucisInstance = baucis();

        app.use('/api', baucisInstance);

        app.use(function (error, request, response, next) {
            if (error) {
                return response.status(500).send(error.toString());
            }
            next();
        });

        server = app.listen(8012);
        done();
    },
    deinit: function (done) {
        mongoose.disconnect();
        server.close();
        done();
    }
};
