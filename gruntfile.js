module.exports = function (grunt) {
	var ENV = process.env.NODE_ENV || 'devel';
	var version = grunt.file.readJSON('package.json').version;

	console.log('Running grunt for environment: ' + ENV+ ' version: ' + version);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

	 	uglify: {
            all: {
                src: [	'./public/app/app.js', 
                	  	'./public/app/services/**/*.js',
						'./public/app/controllers/**/*.js',
						'./public/app/directives/**/*.js',
						'./public/app/filters/**/*.js',
                        '!./public/app/**/*_test.js'
                	   ],
                dest: 'public-html/' + ENV + '/app/app-'+ version +'.min.js'
            }
        },

		copy:{
            resources: {                
                expand: true, 
                cwd: 'public/',
                src: [
                    'app/lib/**',
                    'css/**',
                    'fonts/**',
                    'images/**',
                    'i18n/**',
                    'favicon.ico',
					'bower_components/**',
					'lib/xlsx.full.min.js'
                ], 
                dest: 'public-html/' + ENV 
            },

            html:{
                expand: true, 
                cwd: 'public/',
                src: ['**/*.html'], 
                dest: 'public-html/' + ENV,
                options: {
                    process: function (content, srcpath) {
						if (process.env.GOOGLE_MAP_APIKEY) {
							var mapsRegex = /\/\/maps\.googleapis\.com\/maps\/api\/js/;
							if (mapsRegex.test(content)) {
								content = content.replace(mapsRegex, 
							       '//maps.googleapis.com/maps/api/js?key=' + 
								   process.env.GOOGLE_MAP_APIKEY);
                            } 
						}
						
                        if(/\.html$/.test(srcpath)) {
                            var regex =  /<!-- JS-start -->[\s\S.]*<!-- JS-end -->/; 
                            if (regex.test(content)) {
                                console.log('Replace JS scripts in: ' + srcpath);
                            } 
                            else {                                
                                //console.log('Not found in:       ' + srcpath);
                                return content;
                            }
                            return content.replace(regex, 
                            	                   '<script src="/app/app-'+version+'.min.js"></script>');
                        }
                        else {
                            return content;
                        }
                    }
                }
            },
			
			all:{
                expand: true, 
                cwd: 'public/',
                src: ['**/*.*'], 
                dest: 'public-html/' + ENV,
                options: {
                }
            }
        },

        clean: {
            env: ["public-html/" + ENV],
            all: ["public-html/"]
        },

		mochaTest: {  
            test: {  
                // Ttest settings   
            },  
            coverage: {  
                options: {  
                    reporter: 'html-cov',
                    quiet: false  
                },  
                src: ['test/*.js']  
            }  
        }
         
    });

	grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha-test');

	grunt.registerTask('release', 			['clean:env', 'copy:resources', 'uglify', 'copy:html']);
    grunt.registerTask('devel',   			['clean:env', 'copy:all']);
};
