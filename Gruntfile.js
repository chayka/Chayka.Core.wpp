'use strict';

module.exports = function(grunt) {

    var resFiles = {
        less: ['res/src/css/**/*.less'],
        css: ['res/tmp/css/**/*.css'],
        js: ['res/src/js/**/*.js'],
        img: ['res/src/js/**/*.{png,jpg,gif}'],

        lessNg: ['res/src/ng-modules/**/*.less'],
        cssNg: [
            'res/src/ng-modules/chayka-spinners.css',
            'res/src/ng-modules/chayka-modals.css',
            'res/src/ng-modules/chayka-forms.css',
            'res/src/ng-modules/chayka-options-form.css',
            'res/src/ng-modules/chayka-wp-admin.css'
        ],
        jsNg: [
            'res/src/ng-modules/chayka-utils.js',
            'res/src/ng-modules/chayka-translate.js',
            'res/src/ng-modules/chayka-spinners.js',
            'res/src/ng-modules/chayka-ajax.js',
            'res/src/ng-modules/chayka-modals.js',
            'res/src/ng-modules/chayka-forms.js',
            'res/src/ng-modules/chayka-options-form.js',
            'res/src/ng-modules/chayka-pagination.js',
            'res/src/ng-modules/chayka-wp-admin.js',
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
            developmentNg:{
                files:{
                    'res/src/ng-modules/chayka-forms.css': 'res/src/ng-modules/chayka-forms.less',
                    'res/src/ng-modules/chayka-modals.css': 'res/src/ng-modules/chayka-modals.less',
                    'res/src/ng-modules/chayka-options-form.css': 'res/src/ng-modules/chayka-options-form.less',
                    'res/src/ng-modules/chayka-spinners.css': 'res/src/ng-modules/chayka-spinners.less',
                    'res/src/ng-modules/chayka-wp-admin.css': 'res/src/ng-modules/chayka-wp-admin.less'
                }
            }
        },
        autoprefixer: {
            options: {
                browsers: ['last 2 versions']
            },
            development: {
                src: resFiles.css.concat(resFiles.cssNg)
            }
        },
        csslint: {
            options: {
                csslintrc: '.csslintrc'
            },
            development: {
                src: resFiles.css.concat(resFiles.cssNg)
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
                    'res/dist/ng-modules/chayka-core.min.css': ['res/src/ng-modules/*.css']
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
            }
        },

        //  scripts:
        jshint: {
            options: {
                jshintrc: true
            },
            all: {
                src: resFiles.js.concat(resFiles.jsNg).concat('Gruntfile.js')
            }
        },
        uglify: {
            production: {
                options: {
                    mangle: false
                },
                files: {
                    //'res/dist/js/application.js': resFiles.js,
                    'res/dist/ng-modules/chayka-core.min.js': resFiles.jsNg
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

        //  common:
        clean: {
            css: ['res/tmp/css'],
            js: ['res/tmp/js'],
            img: ['res/tmp/img'],
            all: ['res/tmp']
        },
        watch: {
            js: {
                files: resFiles.js,
                tasks: ['js']
            },
            less: {
                files:  resFiles.less,
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

    grunt.registerTask('js', ['jshint', 'uglify', 'clean:js']);

    grunt.registerTask('img', ['imagemin']);

    grunt.registerTask('default', ['css', 'js', 'img', 'clean:all']);

};