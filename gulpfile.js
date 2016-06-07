'use strict';

/**
 * @var {Gulp} gulp
 */
var gulp = require('gulp');

var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');

var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var csslint = require('gulp-csslint');
var cssnano = require('gulp-cssnano');

var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var merge = require('merge-stream');
var plumber = require('gulp-plumber');

var bump = require('gulp-bump');
var argv = require('yargs').argv;
var git = require('gulp-git');
var shell = require('gulp-shell');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');

var fs = require('fs');
var pkg = require('./package.json');

var paths = {
    resSrcNgLess: ['res/src/ng-modules/**/*.less'],
    resSrcNgCss: ['res/src/ng-modules/**/*.css'],
    resSrcNgJs: ['res/src/ng-modules/**/*.js'],
    resSrcNgCoreCss: [
        'res/src/ng-modules/chayka-spinners.css',
        'res/src/ng-modules/chayka-modals.css',
        'res/src/ng-modules/chayka-forms.css',
        'res/src/ng-modules/chayka-pagination.css'
    ],
    resSrcNgCoreJs: [
        'res/src/ng-modules/chayka-utils.js',
        'res/src/ng-modules/chayka-buttons.js',
        'res/src/ng-modules/chayka-nls.js',
        'res/src/ng-modules/chayka-spinners.js',
        'res/src/ng-modules/chayka-ajax.js',
        'res/src/ng-modules/chayka-modals.js',
        'res/src/ng-modules/chayka-forms.js',
        'res/src/ng-modules/chayka-pagination.js'
    ],
    resSrcNgAdminCss: [
        'res/src/ng-modules/chayka-wp-admin.css'
    ],
    resSrcNgAdminJs: [
        'res/src/ng-modules/chayka-wp-admin.js'
    ],
    resSrcNgEmailCss: [
        'res/src/ng-modules/chayka-email.css'
    ],
    resSrcNgEmailJs: [
        'res/src/ng-modules/chayka-email.js'
    ],
    resSrcNgAvatarsJs: [
        'res/src/ng-modules/chayka-avatars.js'
    ],
    resSrcImg: 'res/src/img/**/*',
    resDistImg: 'res/dist/img',
    resSrcNg: 'res/src/ng-modules',
    resDistNg: 'res/dist/ng-modules',
    resDist: 'res/dist',
    pkgConfigs: [
        'package.json',
        'bower.json',
        'composer.json',
        'chayka.json',
        '.yo-rc.json'
    ]
};

paths.jsAll = paths.resSrcNgCoreJs.concat(paths.resSrcNgAdminJs).concat(paths.resSrcNgAvatarsJs);
paths.cssAll = paths.resSrcNgCoreCss.concat(paths.resSrcNgAdminCss);

function handleError(err) {
    console.log(err.toString());
    this.emit('end');
}

var write = function(pipe, dst){
    return pipe
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dst));
};

var uglifyCss = function(src, cat, dst){
    var res = gulp.src(src)
        .pipe(plumber(handleError))
        .pipe(sourcemaps.init())
        .pipe(cssnano());
    if(cat){
        res = res.pipe(concat(cat));
    }
    if(dst){
        res = write(res, dst);
    }
    return res;
};

var uglifyJs = function(src, cat, dst){
    var res = gulp.src(src)
        .pipe(plumber(handleError))
        .pipe(sourcemaps.init())
        .pipe(uglify({
            mangle: false
        }));
    if(cat){
        res = res.pipe(concat(cat));
    }
    if(dst){
        res = write(res, dst);
    }
    return res;
};

gulp.task('clean', function(){
    return gulp.src([paths.resDist], {read: false})
        .pipe(clean({force: true}));
});

/**
 * CSS
 */
gulp.task('less', function(){
    return gulp.src(paths.resSrcNgLess)
        .pipe(plumber(handleError))
        .pipe(less())
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(gulp.dest(paths.resSrcNg));
});

gulp.task('lint:css', function() {
    gulp.src(paths.resSrcNgCss)
        .pipe(plumber(handleError))
        .pipe(csslint())
        .pipe(csslint.reporter());
});

gulp.task('css:core', function(){
    var core = uglifyCss(paths.resSrcNgCoreCss);
    var angularCse = uglifyCss('res/lib/angular/angular-csp.css');
    var merged = merge(angularCse, core);
    return write(merged.pipe(concat('chayka-core.css')), paths.resDistNg);
});

gulp.task('css:admin', function(){
    return uglifyCss(paths.resSrcNgAdminCss, 'chayka-admin.css', paths.resDistNg)
});

gulp.task('css:email', function(){
    return uglifyCss(paths.resSrcNgEmailCss, 'chayka-email.css', paths.resDistNg)
});

gulp.task('css', ['css:core', 'css:admin', 'css:email']);

/**
 * JS
 */

gulp.task('lint:js', function() {
    gulp.src(paths.resSrcNgJs)
        .pipe(plumber(handleError))
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('js:core', function(){
    var core = uglifyJs(paths.resSrcNgCoreJs);
    var sanitize = uglifyJs('res/lib/angular-sanitize/angular-sanitize.js');
    var merged = merge(sanitize, core);
    return write(merged.pipe(concat('chayka-core.js')), paths.resDistNg);
});

gulp.task('js:admin', function(){
    return uglifyJs(paths.resSrcNgAdminJs, 'chayka-admin.js', paths.resDistNg)
});

gulp.task('js:email', function(){
    return uglifyJs(paths.resSrcNgEmailJs, 'chayka-email.js', paths.resDistNg)
});

gulp.task('js:avatars-md5', function(){
    var avatars = uglifyJs(paths.resSrcNgAvatarsJs);
    var md5 = uglifyJs('res/lib/angular-md5/angular-md5.js');
    var merged = merge(md5, avatars);
    return write(merged.pipe(concat('ng-modules/chayka-avatars-md5.js')), paths.resDist);
});

gulp.task('js', ['js:core', 'js:admin', 'js:avatars-md5', 'js:email']);

gulp.task('img', function(){
    return gulp.src(paths.resSrcImg)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(paths.resDistImg));
});

gulp.task('lint', ['lint:js', 'lint:css']);

/**
 * Releases
 */
gulp.task('git:tag', function(){
    var currentVersion = 'v' + pkg.version;
    git.tag(currentVersion, 'Version ' + pkg.version, function (err) {
        if (err) {
            throw err;
        }
    });
});

gulp.task('git:push', function(){
    git.push('origin', 'master', {args: '--follow-tags'}, function (err) {
        if (err) {
            throw err;
        }
    });
});

gulp.task('git:add', function() {
    return gulp.src('.')
        .pipe(git.add());
});

gulp.task('git:commit:bump', function(){
    var pkgBumped = JSON.parse(fs.readFileSync('./package.json'));
    var newVersion = pkgBumped.version;
    gulp.src('.')
        .pipe(git.commit('Bumped to version ' + newVersion));
});

gulp.task('replace:version:bump', function(){
    var pkgBumped = JSON.parse(fs.readFileSync('./package.json'));
    var newVersion = pkgBumped.version;
    gulp.src(['*.wpp.php', 'style.css'])
        .pipe(replace(/Version:\s*[^\s]+/, 'Version: ' + newVersion))
        .pipe(gulp.dest('.'));
});

gulp.task('release:notes', shell.task([
    'cat RELEASE-NOTES.md >> RELEASE-HISTORY.md',
    'echo "" > RELEASE-NOTES.md'
]));

gulp.task('release', function(){
    runSequence('git:tag', 'release:notes');
});

/**
 * Get a task function that bumps version
 * @param release
 * @return {Function}
 */
function bumpVersion(release){
    return function() {
        release = release || 'prerelease';
        var version = argv.setversion;
        var options = {};
        if (version) {
            options.version = version;
        } else if (release) {
            options.type = release;
        }
        gulp.src(paths.pkgConfigs)
            .pipe(bump(options))
            .pipe(gulp.dest('./'))
            .on('end', function(){
                runSequence('replace:version:bump', 'git:add', 'git:commit:bump', 'git:push');
            });

    };
}
var releaseIfNeeded = pkg.version.indexOf('-') >=0 ? [] : ['release'];
gulp.task('bump:norelease', bumpVersion());
gulp.task('bump:prerelease', releaseIfNeeded, bumpVersion('prerelease'));
gulp.task('bump:patch', releaseIfNeeded, bumpVersion('patch'));
gulp.task('bump:minor', releaseIfNeeded, bumpVersion('minor'));
gulp.task('bump:major', releaseIfNeeded, bumpVersion('major'));

gulp.task('build', function(){
    runSequence('less', 'lint', ['js', 'css', 'img']);
});

gulp.task('watch', ['build'], function(){
    gulp.watch(paths.resSrcNgLess, [
        'less',
        'lint:css'
    ]);
    gulp.watch(paths.resSrcNgJs, [
        'lint:js'
    ]);
    gulp.watch(paths.resSrcNgCoreCss, [
        'css:core'
    ]);
    gulp.watch(paths.resSrcNgAdminCss, [
        'css:admin'
    ]);
    gulp.watch(paths.resSrcNgEmailCss, [
        'css:email'
    ]);
    gulp.watch(paths.resSrcNgCoreJs, [
        'js:core'
    ]);
    gulp.watch(paths.resSrcNgAdminJs, [
        'js:admin'
    ]);
    gulp.watch(paths.resSrcNgAvatarsJs, [
        'js:avatars-md5'
    ]);
    gulp.watch(paths.resSrcNgEmailJs, [
        'js:email'
    ]);
    gulp.watch(paths.resSrcImg, [
        'img'
    ]);
});

gulp.task('default', ['watch']);

