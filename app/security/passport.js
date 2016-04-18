/*global process*/

var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var LocalAPIKeyStrategy = require('passport-localapikey-update').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GitHubStrategy = require('passport-github2').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var WindowsLiveStrategy = require('passport-windowslive').Strategy;

function apply(passport, models, configuration) {

    var UsersModel = models.models._users.model;
    var ProvidersModel = models.models._providers.model;

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        UsersModel.findById(id, function (err, user) {
            done(err, user);
        });
    });

    var validateUserPassword = function (username, password, done) {
        UsersModel.findOne({
            username: username,
            enabled: true
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            if (!user.checkPassword(password)) {
                return done(null, false);
            }

            //update access timestamp
            user.lastAccessOn = new Date();
            user.save(function (err) { });

            return done(null, user);
        });
    };

    var validateApiKey = function (apikey, done) {
        if (configuration.security.apiKey === apikey) {
            return done(null, {
                username: configuration.security.rootAccount,
                role: 'Admin',
                enable: true
            });
        } else {
            return done(null, false);
        }
    };

    var validateToken = function (token, done) {
        UsersModel.findOne({
            token: token,
            enabled: true
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }

            //update access timestamp
            user.lastAccessOn = new Date();
            user.save(function (err) { });

            return done(null, user);
        });
    };

    // Local
    passport.use(new LocalStrategy(validateUserPassword));

    // Basic
    passport.use(new BasicStrategy(validateUserPassword));

    // API Key
    passport.use(new LocalAPIKeyStrategy(validateApiKey));

    // Bearer
    passport.use(new BearerStrategy(validateToken));

    // Google
    if (configuration.googleAuth.clientID && configuration.googleAuth.clientSecret && configuration.googleAuth.callbackURL) {
	    passport.use(new GoogleStrategy({
	        clientID: configuration.googleAuth.clientID,
	        clientSecret: configuration.googleAuth.clientSecret,
	        callbackURL: configuration.googleAuth.callbackURL
	    },
	        function (accessToken, refreshToken, profile, done) {
	            process.nextTick(function () {
	                if (profile && profile.emails && profile.emails.length > 0 && profile.emails[0].value) {
	                    var email = profile.emails[0].value.toLowerCase();
	                    registerUser(email, accessToken, 'Google', models, UsersModel, ProvidersModel, function (err, user) {
	                        return done(err, user);
	                    });
	                } else {
	                    return done(null, false);
	                }
	            });
	        }));
	}

    // Facebook
    if (configuration.facebookAuth.clientID && configuration.facebookAuth.clientSecret && configuration.facebookAuth.callbackURL) {
	    passport.use(new FacebookStrategy({
	        clientID: configuration.facebookAuth.clientID,
	        clientSecret: configuration.facebookAuth.clientSecret,
	        callbackURL: configuration.facebookAuth.callbackURL,
	        profileFields: ['id', 'emails']
	    },
	        function (accessToken, refreshToken, profile, done) {
	            process.nextTick(function () {
	                if (profile && profile.emails && profile.emails.length > 0 && profile.emails[0].value) {
	                    var email = profile.emails[0].value.toLowerCase();
	                    registerUser(email, accessToken, 'Facebook', models, UsersModel, ProvidersModel, function (err, user) {
	                        return done(err, user);
	                    });
	                } else {
	                    return done(null, false);
	                }
	            });
	        }));
	}

    // Github
    if (configuration.githubAuth.clientID && configuration.githubAuth.clientSecret && configuration.githubAuth.callbackURL) {
	    passport.use(new GitHubStrategy({
	        clientID: configuration.githubAuth.clientID,
	        clientSecret: configuration.githubAuth.clientSecret,
	        callbackURL: configuration.githubAuth.callbackURL
	    },
	        function (accessToken, refreshToken, profile, done) {
	            process.nextTick(function () {
	                if (profile && profile.emails && profile.emails.length > 0 && profile.emails[0].value) {
	                    var email = profile.emails[0].value.toLowerCase();
	                    registerUser(email, accessToken, 'GitHub', models, UsersModel, ProvidersModel, function (err, user) {
	                        return done(err, user);
	                    });
	                } else {
	                    return done(null, false);
	                }
	            });
	        }));
	}

    // Twitter
    if (configuration.twitterAuth.clientID && configuration.twitterAuth.clientSecret && configuration.twitterAuth.callbackURL) {
	    passport.use(new TwitterStrategy({
	        consumerKey: configuration.twitterAuth.clientID,
	        consumerSecret: configuration.twitterAuth.clientSecret,
	        callbackURL: configuration.twitterAuth.callbackURL
	    },
	        function (accessToken, refreshToken, profile, done) {
	            process.nextTick(function () {
	                if (profile && profile.username) {
	                    registerUser(profile.username, accessToken, 'Twitter', models, UsersModel, ProvidersModel, function (err, user) {
	                        return done(err, user);
	                    });
	                } else {
	                    return done(null, false);
	                }
	            });
	        }));
	}

    // Windowslive
    if (configuration.windowsliveAuth.clientID && configuration.windowsliveAuth.clientSecret && configuration.windowsliveAuth.callbackURL) {
	    passport.use(new WindowsLiveStrategy({
	        clientID: configuration.windowsliveAuth.clientID,
	        clientSecret: configuration.windowsliveAuth.clientSecret,
	        callbackURL: configuration.windowsliveAuth.callbackURL
	    },
	        function (accessToken, refreshToken, profile, done) {
	            process.nextTick(function () {
	                if (profile && profile.emails && profile.emails.length > 0 && profile.emails[0].value) {
	                    var email = profile.emails[0].value.toLowerCase();
	                    registerUser(email, accessToken, 'Windowslive', models, UsersModel, ProvidersModel, function (err, user) {
	                        return done(err, user);
	                    });
	                } else {
	                    return done(null, false);
	                }
	            });
	        }));
	}
}

function registerUser(email, token, accountType, models, UsersModel, ProvidersModel, done) {
    ProvidersModel.findOne({
        name: accountType,
        enable: true
    }, function (err, provider) {
        if (err || !provider) {
            return done(null, false);
        } else {
            UsersModel.findOne({
                username: email,
                accountType: accountType,
                enabled: true
            }, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (user) {
                    user.token = token;
                    user.lastAccessOn = new Date();
                    user.save(function (err, savedUser) {
                        if (err) {
                            return done(err);
                        }
                        return done(null, savedUser);
                    });
                } else {
                    if (provider.autoEnroll) {
                        var newUser = new UsersModel();
                        newUser.accountType = accountType;
                        newUser.username = email;
                        newUser.token = token;
                        newUser.enabled = true;
                        newUser.role = provider.defaultRole;
                        newUser.lastAccessOn = new Date();
                        newUser.save(function (err, savedUser) {
                            if (err) {
                                return done(err);
                            }
                            return done(null, savedUser);
                        });
                    } else {
                        return done(null, false);
                    }
                }
            });
        }
    });
}

module.exports.apply = apply;