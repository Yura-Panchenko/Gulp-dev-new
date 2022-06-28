const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const pug = require('gulp-pug');
const del = require('del');
const gulpif = require('gulp-if');
const purge = require('gulp-css-purge');

var browserSync = require('browser-sync').create();

let isDevelopment = true;

function server() {
    browserSync.init({
        server: {
            baseDir: "./public/"
        }
    });
}

function pug2html() {
    return src('./dev/pug/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(dest('./public/'))
        .pipe(browserSync.stream());
}

function copyFonts() {
    return src('./dev/fonts/*')
        .pipe(dest('./public/fonts/'))
        .pipe(browserSync.stream());
}

function copyScripts() {
    return src('./dev/js/**/*.js')
        .pipe(dest('./public/js/'))
        .pipe(browserSync.stream());
}

function copyFiles() {
    return src('./dev/assets/*')
        .pipe(dest('./public/'))
        .pipe(browserSync.stream());
}

function copyImages() {
    return src('./dev/images/*')
        .pipe(dest('./public/images/'))
        .pipe(browserSync.stream());
}

function copyHtml() {
    return src(['./dev/views/*.html'])
        .pipe(dest('./public/'))
        .pipe(browserSync.stream())
}

function scss() {
    return src('./dev/styles/**/*.scss')
        .pipe(gulpif(isDevelopment, sourcemaps.init()))
        .pipe(sass(
            //{ outputStyle: 'compressed' }
        ).on('error', sass.logError))
        .pipe(purge({
            trim : true,
            shorten : true,
            verbose : false
        }))
        .pipe(gulpif(isDevelopment, sourcemaps.write()))
        .pipe(dest('./public/css/'))
        .pipe(browserSync.stream());
}

function imagesOptimisation() {
    return src('./dev/images/**/*')
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })]))
        .pipe(dest('./public/images/'))
        .pipe(browserSync.stream());
}

function clean() {
    return del(['public/**', '!public']);
}

function watching() {
    watch('./dev/scss/**/*.scss', scss);
    watch('./dev/js/**/*.js', copyScripts);
    watch('./dev/*.html', copyHtml);
    watch('./dev/pug/*.pug', pug2html);
    watch('./dev/images/**/*', copyImages);
    watch('./dev/fonts/*', copyFonts);
    watch('./dev/assets/*', copyFiles);
}

exports.pug2html = pug2html;
exports.copyImages = copyImages;
exports.copyFiles = copyFiles;
exports.clean = clean;
exports.copyScripts = copyScripts;
exports.copyFonts = copyFonts;
exports.imagesOptimisation = imagesOptimisation;
exports.watching = watching;
exports.server = server;
exports.copyHtml = copyHtml;

exports.default = parallel(
    copyHtml, 
    pug2html, 
    copyImages, 
    copyFiles, 
    copyScripts, 
    copyFonts, 
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
        copyFonts, 
        scss
        )
    );