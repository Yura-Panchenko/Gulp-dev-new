const settings = require('./gulp-settings.js');
const { src, dest, series, parallel, watch, lastRun } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sassImporter = require('node-sass-tilde-importer');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const pug = require('gulp-pug');
const del = require('del');
const gulpif = require('gulp-if');
const purge = require('gulp-css-purge');
const rename = require('gulp-rename');
const minify = require('gulp-minify');
const rigger = require('gulp-rigger');
const plumber = require('gulp-plumber');
const count = require('gulp-count');
const cache = require('gulp-cached');
const autoprefixer = require('gulp-autoprefixer');
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
    return src([`${settings.pugDir.entry}/**/*.pug`, `!${settings.pugDir.entry}/**/_*.pug`])
        .pipe(plumber())
        .pipe(cache('pug2html'))
        .pipe(pug({
            pretty: true
        }))
        .pipe(plumber.stop())
        .pipe(dest(settings.publicDir))
        .pipe(browserSync.stream());
}

function pugWatch() {
    return src(`${settings.pugDir.entry}/*.pug`)
        .pipe(plumber())
        .pipe(pug({
            pretty: true
        }))
        .pipe(plumber.stop())
        .pipe(dest(settings.publicDir))
        .pipe(browserSync.stream());
}

function copyScripts() {
    return src(`${settings.jsDir.entry}/**/*.js`)
        .pipe(plumber())
        .pipe(cache('copyScripts'))
        .pipe(gulpif(!isDevelopment, minify({
            ext: {
                min: '.min.js'
            },
            ignoreFiles: ['*.min.js'],
            preserveComments: true
        })))
        .pipe(plumber.stop())
        .pipe(dest(settings.jsDir.output))
        .pipe(browserSync.stream());
}

function copyFiles() {
    return src(`${settings.assetsDir.entry}/**/*`)
        .pipe(plumber())
        .pipe(cache('copyFiles'))
        .pipe(dest(settings.assetsDir.output))
        .pipe(plumber.stop())
        .pipe(browserSync.stream())
        .pipe(count('## assets copied'));
}

function copyHtml() {
    return src(`${settings.viewsDir.entry}/*.html`)
        .pipe(plumber())
        .pipe(cache('copyHtml'))
        .pipe(rigger())
        .pipe(plumber.stop())
        .pipe(dest(settings.viewsDir.output))
        .pipe(browserSync.stream())
        .pipe(count('## html copied'));
}

function scss() {
    return src(`${settings.scssDir.entry}/**/*.scss`)
        .pipe(plumber())
        .pipe(cache('scss'))
        .pipe(gulpif(isDevelopment, sourcemaps.init()))
        .pipe(sass({
            importer: sassImporter
        }).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(purge({
            trim: false,
            shorten: true,
            format: true,
            format_font_family: false,
            verbose: false
        }))
        .pipe(gulpif(isDevelopment, sourcemaps.write()))
        .pipe(plumber.stop())
        .pipe(dest(settings.scssDir.output))
        .pipe(browserSync.stream());
}

function minCss() {
    return src(`${settings.scssDir.output}/${settings.scssDir.mainFileName}.css`)
        .pipe(plumber())
        .pipe(rename(`${settings.scssDir.mainFileName}.min.css`))
        .pipe(purge({
            trim: true,
            shorten: true,
            format: true,
            format_font_family: false,
            verbose: false
        }))
        .pipe(plumber.stop())
        .pipe(dest(settings.scssDir.output));
}

function imagesOptimisation() {
    return src(`${settings.imagesDir.entry}/**/*`)
        .pipe(plumber())
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
        .pipe(plumber.stop())
        .pipe(dest(settings.imagesDir.output));
}

function cleanDist(cb) {
    del([`${settings.publicDir}/**`, `!${settings.publicDir}`]);
    cb();
}

function cleanCache(cb) {
    cache.caches = {};
    cb();
}

function watching(cb) {
    watch(`${settings.scssDir.entry}/**/*.scss`, scss);
    watch(`${settings.jsDir.entry}/**/*.js`, copyScripts);
    watch(`${settings.viewsDir.entry}/**/*.html`, copyHtml);
    watch([`${settings.pugDir.entry}/*.pug`, `${settings.pugDir.entry}/inc/*.pug`], pug2html);
    watch(`${settings.pugDir.entry}/**/_*.pug`, pugWatch);
    watch(`${settings.assetsDir.entry}/**/*`, copyFiles);

    cb();
}

exports.default = parallel(
    copyHtml,
    copyFiles,
    copyScripts,
    scss,
    server,
    watching);

exports.pug = parallel(
    pug2html,
    copyFiles,
    copyScripts,
    scss,
    server,
    watching);

exports.dist = series(
    (cb) => {
        isDevelopment = false;
        cb();
    },
    cleanCache,
    cleanDist,
    parallel(
        copyHtml,
        imagesOptimisation,
        copyScripts,
        copyFiles,
        series(scss, minCss)
    )
);

exports.distPug = series(
    (cb) => {
        isDevelopment = false;
        cb();
    },
    cleanCache,
    cleanDist,
    parallel(
        pug2html,
        imagesOptimisation,
        copyScripts,
        copyFiles,
        series(scss, minCss)
    )
);