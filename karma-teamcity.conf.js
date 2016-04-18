module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      'public/bower_components/angular/angular.js',
      'public/bower_components/angular-route/angular-route.js',
      'public/bower_components/angular-sanitize/angular-sanitize.js',
      'public/bower_components/angular-animate/angular-animate.js',
      'public/bower_components/angular-cookies/angular-cookies.js',
      'public/bower_components/angular-bootstrap/ui-bootstrap.js',
      'public/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'public/bower_components/angular-translate/angular-translate.js',
      'public/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
      'public/bower_components/angular-translate-loader-partial/angular-translate-loader-partial.js',              
      'public/bower_components/textAngular/dist/textAngular-rangy.min.js',      
      'public/bower_components/textAngular/dist/textAngular-sanitize.min.js',      
      'public/bower_components/textAngular/dist/textAngular.min.js',         
      'public/bower_components/angularjs-geolocation/dist/angularjs-geolocation.min.js',
      'public/bower_components/ngmap/build/scripts/ng-map.min.js',
      'public/bower_components/angular-loading-bar/build/loading-bar.min.js',
      'public/bower_components/bootstrap-ui-datetime-picker/dist/datetime-picker.min.js',
      'public/bower_components/ng-sortable/dist/ng-sortable.min.js',

      'public/bower_components/angular-mocks/angular-mocks.js',
      'public/app/**/*.js',
      'public/app/app.js'
    ],

    exclude: [
      'public/lib/xlsx.full.min.js'
    ],

    autoWatch : false,
    colors: true,
    frameworks: ['jasmine'],

    browsers: ['PhantomJS'],
    //browsers : ['Chrome'],  
    //browsers : ['Chrome','PhantomJS'],  
    //browsers : ['Chrome','PhantomJS', 'Firefox'],  

    plugins : [
            'karma-chrome-launcher',
            'karma-phantomjs-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-teamcity-reporter',
            'karma-coverage'            
            ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        // do not include tests or libraries
        // (these files will be instrumented by Istanbul)
        'public/app/controllers/**/*.js': 'coverage',
        'public/app/directives/**/*.js':  'coverage',
        'public/app/filters/**/*.js':     'coverage',
        'public/app/services/**/*.js':    'coverage',
        'public/app/app.js':              'coverage'
    },

    reporters: [ 'teamcity',
                 'progress',
                 'junit', 
                 'coverage' ],

    // configure the reporter
    coverageReporter: {
            reporters: [
                { type: 'html' },
                { type: 'teamcity' }
            ]
        },


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    //logLevel: config.LOG_DEBUG,

    //loggers: [{type: 'console'}],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};