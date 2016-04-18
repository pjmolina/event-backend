

// SampleBackend
angular.module('myApp', ['ngRoute', 'ngCookies', 'ui.bootstrap', 'ui.bootstrap.datetimepicker',
                         'textAngular', 'pascalprecht.translate', 'translateApp', 'geolocation', 
                         'ngMap', 'angular-loading-bar', 'as.sortable'])
	.config(['$routeProvider', function ($routeProvider) {
		$routeProvider
			.when('/', 					{ templateUrl: 'views/main.html',  controller: 'MainController' })
			.when('/login',				{ templateUrl: 'views/login.html',  controller: 'LoginController' })
			.when('/logout',			{ templateUrl: 'views/logout.html', controller: 'LogoutController' })
			.when('/import/:class',		{ templateUrl: 'views/import.html', controller: 'ImportController' })


			.when('/place/',			 { templateUrl: 'views/place/list.html',   controller: 'ListPlaceController' })
			.when('/place/select',	 { templateUrl: 'views/place/select.html', controller: 'SelectPlaceController' })
			.when('/place/add',        { templateUrl: 'views/place/edit.html',   controller: 'EditPlaceController' })
			.when('/place/edit/:id', 	 { templateUrl: 'views/place/edit.html',   controller: 'EditPlaceController' })
			.when('/place/delete/:id', { templateUrl: 'views/place/edit.html', 	 controller: 'EditPlaceController' })
			.when('/place/view/:id', 	 { templateUrl: 'views/place/edit.html', 	 controller: 'EditPlaceController' })

			.when('/sessionTalk/',			 { templateUrl: 'views/sessionTalk/list.html',   controller: 'ListSessionTalkController' })
			.when('/sessionTalk/select',	 { templateUrl: 'views/sessionTalk/select.html', controller: 'SelectSessionTalkController' })
			.when('/sessionTalk/add',        { templateUrl: 'views/sessionTalk/edit.html',   controller: 'EditSessionTalkController' })
			.when('/sessionTalk/edit/:id', 	 { templateUrl: 'views/sessionTalk/edit.html',   controller: 'EditSessionTalkController' })
			.when('/sessionTalk/delete/:id', { templateUrl: 'views/sessionTalk/edit.html', 	 controller: 'EditSessionTalkController' })
			.when('/sessionTalk/view/:id', 	 { templateUrl: 'views/sessionTalk/edit.html', 	 controller: 'EditSessionTalkController' })

			.when('/speaker/',			 { templateUrl: 'views/speaker/list.html',   controller: 'ListSpeakerController' })
			.when('/speaker/select',	 { templateUrl: 'views/speaker/select.html', controller: 'SelectSpeakerController' })
			.when('/speaker/add',        { templateUrl: 'views/speaker/edit.html',   controller: 'EditSpeakerController' })
			.when('/speaker/edit/:id', 	 { templateUrl: 'views/speaker/edit.html',   controller: 'EditSpeakerController' })
			.when('/speaker/delete/:id', { templateUrl: 'views/speaker/edit.html', 	 controller: 'EditSpeakerController' })
			.when('/speaker/view/:id', 	 { templateUrl: 'views/speaker/edit.html', 	 controller: 'EditSpeakerController' })

			.when('/sponsor/',			 { templateUrl: 'views/sponsor/list.html',   controller: 'ListSponsorController' })
			.when('/sponsor/select',	 { templateUrl: 'views/sponsor/select.html', controller: 'SelectSponsorController' })
			.when('/sponsor/add',        { templateUrl: 'views/sponsor/edit.html',   controller: 'EditSponsorController' })
			.when('/sponsor/edit/:id', 	 { templateUrl: 'views/sponsor/edit.html',   controller: 'EditSponsorController' })
			.when('/sponsor/delete/:id', { templateUrl: 'views/sponsor/edit.html', 	 controller: 'EditSponsorController' })
			.when('/sponsor/view/:id', 	 { templateUrl: 'views/sponsor/edit.html', 	 controller: 'EditSponsorController' })


			.when('/admin/webHooks/', { templateUrl: 'views/admin/webHooks.html', controller: 'AdminWebHooksController' })
			.when('/admin/users/',  { templateUrl: 'views/admin/users.html', controller: 'AdminUsersController' })
			.when('/admin/permissions/',  { templateUrl: 'views/admin/permissions.html', controller: 'AdminPermissionsController' })

			.when('/403',  		 	 { templateUrl: 'views/403.html' })

			.otherwise({ redirectTo: '/login' });
	}])

	.constant('AUTH_EVENTS', {
		loginSuccess: 'auth-login-success',
		loginFailed: 'auth-login-failed',
		logoutSuccess: 'auth-logout-success',
		sessionTimeout: 'auth-session-timeout',
		notAuthenticated: 'auth-not-authenticated',
		notAuthorized: 'auth-not-authorized'
	})

	.constant('USER_ROLES', {
		admin: 'admin'
	})

	//using:  https://github.com/Gillardo/bootstrap-ui-datetime-picker
	.constant('uiDatetimePickerConfig', {
		dateFormat: 'yyyy-MM-dd HH:mm',
		enableDate: true,
		enableTime: true,
		todayText: 'Today',
		nowText: 'Now',
		clearText: 'Clear',
		closeText: 'Done',
		dateText: 'Date',
		timeText: 'Time',
		closeOnDateSelection: true,
		appendToBody: false,
		showButtonBar: true
	})	

	.run(['$rootScope', '$location', 'Session', function($rootScope, $location, Session) {
		// register listener to watch route changes
		$rootScope.$on( "$routeChangeStart", function(event, next, current) {
			if ( $rootScope.isLogged !== true  ) {
				if ( next.templateUrl == "views/login.html" ) {
				  // already going to #login, no redirect needed
				} else {
					// not going to #login, we should redirect now (and store current route for later redirect)
					$rootScope.requestedRoute = $location.path();
					$location.path( "/login" );
				}
			}
			else {
				//logged. Check Role Authorization
				if ( next.templateUrl && (next.templateUrl.substr(0, 12) === "views/admin/") ) {
					if (!Session.userHasRole("Admin")) {
						$location.path( "/403" );
					}
				}
			}		  			
		});
	}])
;

angular.module('myApp').value('baseUrl', 			'');
angular.module('myApp').value('baseApi', 			'/api');

