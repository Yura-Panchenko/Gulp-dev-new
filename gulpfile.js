const settings = require('./gulp-settings.js');
const { src, dest, series, parallel, watch, lastRun } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const pug = require('gulp-pug');
const del = require('del');
const gulpif = require('gulp-if');
const purge = require('gulp-css-purge');
const rename = require('gulp-rename');
const minify = require('gulp-minify');
const rigger = require('gulp-rigger');

var browserSync = require('browser-sync').create();

let isDevelopment = true;

function server() {
    browserSync.init({
        server: {
            baseDir: settings.publicDir
        }
    });
}

function pug2html() {
    return src(`${settings.pugDir.entry}/*.pug`)
        .pipe(pug({
            pretty: true
        }))
        .pipe(dest(settings.publicDir))
        .pipe(browserSync.stream());
}

function copyScripts() {
    return src(`${settings.jsDir.entry}/**/*.js`, { since: lastRun(copyScripts) })
        .pipe(gulpif(settings.minifyScripts, minify({
            ext: {
                min: '.min.js'
            },
            ignoreFiles: ['-min.js', '.min.js'],
            noSource: true,
            preserveComments: true
        })))
        .pipe(dest(settings.jsDir.output))
        .pipe(browserSync.stream());
}

function copyFiles() {
    return src(`${settings.assetsDir.entry}/**/*`,{ since: lastRun(copyScripts) })
        .pipe(dest(settings.assetsDir.output))
        .pipe(browserSync.stream());
}

function copyHtml() {
    return src(`${settings.viewsDir.entry}/*.html`)
        .pipe(rigger())
        .pipe(dest(settings.viewsDir.output))
        .pipe(browserSync.stream())
}

function scss() {
    return src(`${settings.scssDir.entry}/**/*.scss`)
        .pipe(gulpif(isDevelopment, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(purge({
            trim: false,
            shorten: true,
            format: true,
            format_font_family: false,
            verbose: false
        }, function(error, result) {
            if (error)
                console.log(error);
        }))
        .pipe(gulpif(isDevelopment, sourcemaps.write()))
        .pipe(dest(settings.scssDir.output))
        .pipe(browserSync.stream());
}

function purCss() {
    return src(`${settings.scssDir.output}/${settings.scssDir.mainFileName}.css`)
        .pipe(purge({
            trim: true,
            shorten: true,
            verbose: false
        }, function(error, result) {
            if (error)
                console.log(error);
        }))
        .pipe(dest(settings.scssDir.output))
        .pipe(rename(`${settings.scssDir.mainFileName}.min.css`))
        .pipe(dest(settings.scssDir.output));
}

function imagesOptimisation() {
    return src(`${settings.imagesDir.entry}/**/*`)
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 85, progressive: true }),
            imagemin.optipng({ optimizationLevel: 3 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ], {
            verbose: true
        }))
        .pipe(dest(settings.imagesDir.output));
}

function clean() {
    return del([`${settings.publicDir}/**`, `!${settings.publicDir}`]);
}

function watching() {
    watch(`${settings.scssDir.entry}/**/*.scss`, scss);
    watch(`${settings.jsDir.entry}/**/*.js`, copyScripts);
    watch(`${settings.viewsDir.entry}/**/*`, copyHtml);
    watch(`${settings.pugDir.entry}/*.pug`, pug2html);
    watch(`${settings.assetsDir.entry}/**/*`, copyFiles);
}

exports.default = parallel(
    copyHtml,
    // pug2html,
    copyFiles,
    copyScripts,
    scss,
    server,
    watching);

exports.default = parallel(
    copyHtml,
    // pug2html,
    copyFiles,
    copyScripts,
    scss,
    server,
    watching);

exports.dist = series((cb) => {
        isDevelopment = false;
        cb();
    },
    clean,
    parallel(
        copyHtml,
        imagesOptimisation,
        copyScripts,
        copyFiles,
        series(scss, purCss)
    )
);