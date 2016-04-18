//AuthN ----
/*global process*/

function userToClient(user) {
    return {
        "id": user.id,
        "user": {
            "id": user.username,
            "role": user.role
        }
    };
}

function apply(app, models, passport, configuration) {
	var ProviderModel = models.models._providers.model;
	
	//CORS enabled for allowing 3rd party web-apps to consume Swagger metadata and backend. 
	//Disable it commenting this block if you don not need it. ----------
	app.all('*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");  //Change * to your host domain
		res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
		res.header("Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE");
	    next();
	});
	
	// Local
	app.post('/webLogin', passport.authenticate('local'), function (req, res) {
		res.send(userToClient(req.user));
	});
	app.post('/webLogout', function (req, res) {
		req.logout();
		res.sendStatus(200);
	});
	app.get('/loggedin', function (req, res) {
		var result = {};
		if (req.isAuthenticated()) {
			result = userToClient(req.user);
			result.loggedin = 1;
		} else {
			result.loggedin = 0;
		}
		res.send(result);
	});
	app.get('/providers', function(req, res) {
		try {
			ProviderModel.find({}, 'name enable order',function(err, providers) {
				if (err) {
					return res.status(412).json({ error: err });
				}
				var results = [];
				providers.forEach(function(provider) {
					if(isProviderConfigured(provider.name)) {
						results.push(provider);
					}
				}, this);
				
				return res.status(200).json(results);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});
	app.get('/api/admin/providers', function(req, res) {
		try {
			ProviderModel.find({}, function(err, providers) {
				if (err) {
					return res.status(412).json({ error: err });
				}
				var results = [];
				providers.forEach(function(element) {
					var provider = JSON.parse(JSON.stringify(element));
					provider.configured = isProviderConfigured(provider.name);
					if(!provider.configured) {
						provider.enable = false;
						provider.autoEnroll = false;
					}
					results.push(provider);
				}, this);
				
				return res.status(200).json(results);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});


	// Google
	app.get('/oauth2/google', passport.authenticate('google', {
		scope: ['profile', 'email']
	}));
	app.get('/oauth2/google/callback', passport.authenticate('google', {
		failureRedirect: '/#/login'
	}), function (req, res) {
		res.status(200).redirect('/');
	}, function(err, req, res, next) {
		if(err) {
			return res.status(400).json(err);
		}
		else {
			return res.status(200).redirect('/');	
		}
	});
	
	// Facebook
	app.get('/oauth2/facebook', passport.authenticate('facebook', {
		scope: 'email'
	}));
	app.get('/oauth2/facebook/callback', passport.authenticate('facebook', {
		failureRedirect: '/#/login'
	}), function (req, res) {
		res.status(200).redirect('/');
	}, function(err, req, res, next) {
		if(err) {
			return res.status(400).json(err);
		}
		else {
			return res.status(200).redirect('/');	
		}
	});
	
	// Github
	app.get('/oauth2/github', passport.authenticate('github', {
		scope: ['user:email']
	}));
	app.get('/oauth2/github/callback', passport.authenticate('github', {
		failureRedirect: '/#/login'
	}), function (req, res) {
		res.status(200).redirect('/');
	}, function(err, req, res, next) {
		if(err) {
			return res.status(400).json(err);
		}
		else {
			return res.status(200).redirect('/');	
		}
	});
	
	// Twiter
	app.get('/oauth2/twitter', passport.authenticate('twitter'));
	app.get('/oauth2/twitter/callback', passport.authenticate('twitter', {
		failureRedirect: '/#/login'
	}), function (req, res) {
		res.status(200).redirect('/');
	}, function(err, req, res, next) {
		if(err) {
			return res.status(400).json(err);
		}
		else {
			return res.status(200).redirect('/');	
		}
	});
	
	// Windowslive
	app.get('/oauth2/windowslive', passport.authenticate('windowslive', {
		scope: ['wl.emails', 'wl.signin', 'wl.basic']
	}));
	app.get('/oauth2/windowslive/callback', passport.authenticate('windowslive', {
		failureRedirect: '/#/login'
	}), function (req, res) {
		res.status(200).redirect('/');
	}, function(err, req, res, next) {
		if(err) {
			return res.status(400).json(err);
		}
		else {
			return res.status(200).redirect('/');	
		}
	});

	//Auth helpers-----
	var isAuthenticated = function (req, res, next) {
		if (!isProtectedContent(req)) {
			return next(); //Public content (no protection)
		}
	
		if (req.isAuthenticated()) {
			return next();
		} else {
			//Check for basic auth - Step 1
			passport.authenticate('basic', {
				session: false
			}, function (err, user, info) {
				if (!err && user) {
					req.user = user;
					return next();
				}
				//Check for Bearer token - Step 2
				passport.authenticate('bearer', {
					session: false
				}, function (err, user, info) {
					if (!err && user) {
						req.user = user;
						return next();
					}
	
					//Else check for API KEY - Step 3
					return passport.authenticate('localapikey', {
						session: false
					})(req, res, next);
				})(req, res, next);
			})(req, res, next);
		}
	};
	
	var isAuthorized = function (req, res, next) {
		if (req.url.substr(0, 10) === '/api/admin') {
			if (req.user.role === "Admin") {
				return next();
			} else {
				return res.status(403).json({ code:403, message: 'Forbidden' });
			}
		} else {
			return next();
		}
	};
	
	function isProtectedContent(req) {
		return req.url.substr(0, 5) === '/api/' || req.url.substr(0, 5) === '/api?';
	}
	
	function isProviderConfigured(providerName) {
		return (
			process.env['OAUTH2_' + providerName.toUpperCase() + '_CLIENTID'] &&
			process.env['OAUTH2_' + providerName.toUpperCase() + '_CLIENTSECRET'] &&
			process.env.OAUTH2_BASEHOST
			) ? true : false;
	}
	
	//API Auth ----------
	app.all('*', isAuthenticated, isAuthorized);

	return this;
}

module.exports.apply = apply;