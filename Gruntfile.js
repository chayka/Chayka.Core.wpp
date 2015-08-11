'use strict';

module.exports = function(grunt) {

    var resFiles = {
        less: ['res/src/css/**/*.less'],
        css: ['res/tmp/css/**/*.css'],
        js: ['res/src/js/**/*.js'],
        img: ['res/src/js/**/*.{png,jpg,gif}'],

        lessNg: ['res/src/ng-modules/**/*.less'],
        cssCore: [
            'res/src/ng-modules/chayka-spinners.css',
            'res/src/ng-modules/chayka-modals.css',
            'res/src/ng-modules/chayka-forms.css',
            'res/src/ng-modules/chayka-pagination.css'
        ],
        jsCore: [
            'res/src/ng-modules/chayka-utils.js',
            'res/src/ng-modules/chayka-buttons.js',
            'res/src/ng-modules/chayka-translate.js',
            'res/src/ng-modules/chayka-spinners.js',
            'res/src/ng-modules/chayka-ajax.js',
            'res/src/ng-modules/chayka-modals.js',
            'res/src/ng-modules/chayka-forms.js',
            'res/src/ng-modules/chayka-pagination.js'
        ],
        cssAdmin: [
            'res/src/ng-modules/chayka-options-form.css',
            'res/src/ng-modules/chayka-wp-admin.css'
        ],
        jsAdmin: [
            'res/src/ng-modules/chayka-options-form.js',
            'res/src/ng-modules/chayka-wp-admin.js'
        ],
        jsAvatars: [
            'res/src/ng-modules/chayka-avatars.js'
        ]
    };

    var chayka = grunt.file.readJSON('chayka.json');
    var isPlugin = chayka.appType === 'plugin';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // styles:
        less: {
            development:{
                files:{
                    'res/tmp/css/less.css': resFiles.less
                }
            },
            developmentCore:{
                files:{
                    'res/src/ng-modules/chayka-forms.css': 'res/src/ng-modules/chayka-forms.less',
                    'res/src/ng-modules/chayka-modals.css': 'res/src/ng-modules/chayka-modals.less',
                    'res/src/ng-modules/chayka-spinners.css': 'res/src/ng-modules/chayka-spinners.less',
                    'res/src/ng-modules/chayka-pagination.css': 'res/src/ng-modules/chayka-pagination.less'
                }
            },
            developmentAdmin:{
                files:{
                    'res/src/ng-modules/chayka-options-form.css': 'res/src/ng-modules/chayka-options-form.less',
                    'res/src/ng-modules/chayka-wp-admin.css': 'res/src/ng-modules/chayka-wp-admin.less'
                }
            }
        },
        autoprefixer: {
            options: {
                browsers: ['last 2 versions']
            },
            development: {
                src: resFiles.css.concat(resFiles.cssCore).concat(resFiles.cssAdmin)
            }
        },
        csslint: {
            options: {
                csslintrc: '.csslintrc'
            },
            development: {
                src: resFiles.css.concat(resFiles.cssCore).concat(resFiles.cssAdmin)
            }
        },
        cssmin: {
            theme: {
                files: {
                    'res/tmp/css/min.css': ['res/src/css/*.css']
                }
            },
            plugin: {
                files: {
                    'res/dist/css/style.css': ['res/src/css/*.css']
                }
            },
            ng: {
                files: {
                    'res/dist/ng-modules/chayka-core.css': [
                        'res/lib/angular/angular-csp.css',
                        'res/src/ng-modules/chayka-forms.css',
                        'res/src/ng-modules/chayka-modals.css',
                        'res/src/ng-modules/chayka-spinners.css',
                        'res/src/ng-modules/chayka-pagination.css'
                    ],
                    'res/dist/ng-modules/chayka-admin.css': [
                        'res/src/ng-modules/chayka-options-form.css',
                        'res/src/ng-modules/chayka-wp-admin.css'
                    ]
                }
            }
        },
        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                //separator: ';\n'
            },
            theme: {
                // the files to concatenate
                files:{
                    'style.css':[
                        'res/src/theme-header.css',
                        'res/tmp/css/min.css'
                    ]
                }
            },
            core: {
                files: {
                    'res/dist/ng-modules/chayka-core.js': [
                        'res/lib/angular-translate/angular-translate.min.js',
                        'res/lib/angular-sanitize/angular-sanitize.min.js',
                        'res/dist/ng-modules/chayka-core.js'
                    ],
                    'res/dist/ng-modules/chayka-avatars-md5.js': [
                        'res/lib/angular-md5/angular-md5.min.js',
                        'res/dist/ng-modules/chayka-avatars-md5.js'
                    ]
                }
            }
        },

        //  scripts:
        jshint: {
            options: {
                jshintrc: true
            },
            all: {
                src: resFiles.js.concat(resFiles.jsCore).concat(resFiles.jsAdmin).concat(resFiles.jsAvatars).concat('Gruntfile.js')
            }
        },
        uglify: {
            js: {
                files: [{
                    expand: true,
                    cwd: 'res/src/js/',
                    src: ['**/*.js'],
                    dest: 'res/dist/js/'
                }]
            },
            ng: {
                options: {
                    mangle: false
                },
                files: {
                    //'res/dist/js/application.js': resFiles.js,
                    'res/dist/ng-modules/chayka-core.js': resFiles.jsCore,
                    'res/dist/ng-modules/chayka-admin.js': resFiles.jsAdmin,
                    'res/dist/ng-modules/chayka-avatars-md5.js': resFiles.jsAvatars
                }
            }
        },

        //  images:
        imagemin: {                          
            dynamic: {                         
                files: [{
                    expand: true,               
                    cwd: 'res/src/img/',        
                    src: ['**/*.{png,jpg,gif}'],
                    dest: 'res/dist/img/'       
                }]
            }
        },

        dgeni: {
            options: {
                // Specify the base path used when resolving relative paths to source files
                basePath: 'res/src/ng-modules'
            },
            src: ['*.js'],
            dest: 'docs/ng-modules'
        },

        //  common:
        clean: {
            css: ['res/tmp/css'],
            js: ['res/tmp/js'],
            img: ['res/tmp/img'],
            all: ['res/tmp']
        },
        watch: {
            js: {
                files: resFiles.js.concat(resFiles.jsCore).concat(resFiles.jsAdmin).concat(resFiles.jsAvatars),
                tasks: ['js']
            },
            less: {
                files:  resFiles.less.concat(resFiles.lessNg),
                tasks: ['css']
            },
            img: {
                files:  resFiles.img,
                tasks: ['img']
            }
        }
    });

    // Load NPM tasks
    require('load-grunt-tasks')(grunt);

    // Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    grunt.registerTask('css-theme', ['less', 'autoprefixer', 'csslint', 'cssmin:theme', 'cssmin:ng', 'concat:theme', 'clean:css']);

    grunt.registerTask('css-plugin', ['less', 'autoprefixer', 'csslint', 'cssmin:plugin', 'cssmin:ng', 'clean:css']);

    grunt.registerTask('css', isPlugin?['css-plugin']:['css-theme']);

    grunt.registerTask('js', ['jshint', 'uglify', 'concat:core', 'clean:js']);

    grunt.registerTask('img', ['imagemin']);

    grunt.registerTask('default', ['css', 'js', 'img', 'clean:all']);

};