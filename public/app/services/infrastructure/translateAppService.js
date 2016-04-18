angular.module('translateApp', ['pascalprecht.translate'])
	.config(['$translateProvider', function($translateProvider) {

		$translateProvider.useLoader('$translatePartialLoader', {
			urlTemplate: '/i18n/{part}.{lang}.json'
		});

		$translateProvider.preferredLanguage('en-US');
		//$translateProvider.preferredLanguage('es-ES');

		//$translateProvider.useLocalStorage();
		//$translateProvider.preferredLanguage($translateProvider.determinePreferredLanguage());
	}])
	
	.config([ '$translatePartialLoaderProvider', function run($translatePartialLoaderProvider) {
		$translatePartialLoaderProvider.addPart('literals');
	}]);