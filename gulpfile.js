'use strict';

var gulp = require('gulp'),
    tsc = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    del = require('del'),
    gulpSequence = require('gulp-sequence'),
    Config = require('./gulpfile.config'),
    tsProject = tsc.createProject('tsconfig.json');

var config = new Config();


/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', function () {
    var sourceTsFiles = [config.allTypeScript];
    var tsResult = gulp.src(sourceTsFiles)
                       //.pipe(sourcemaps.init())
                       .pipe(tsc(tsProject));

    tsResult.dts.pipe(gulp.dest(config.tsOutputPath));
    return tsResult.js//.pipe(sourcemaps.write('.'))
                      .pipe(gulp.dest(config.tsOutputPath));
});

/**
 * Remove all generated JavaScript files from TypeScript compilation.
 */
gulp.task('clean-ts', function () {
  var typeScriptGenFiles = [
                              config.tsOutputPath +'/**/*.js',    // path to all JS files auto gen'd by editor
                              config.tsOutputPath +'/**/*.js.map', // path to all sourcemap files auto gen'd by editor
                              '!' + config.tsOutputPath + '/lib'
                           ];

  // delete the files
  return del(typeScriptGenFiles);
});

gulp.task('default', gulpSequence('clean-ts', 'compile-ts'));
