import glob from 'glob';
import gulp from 'gulp';
import nunjucks from 'gulp-nunjucks';
import rimraf from 'rimraf';
import imagemin from 'gulp-imagemin';
import imageminWebp from 'imagemin-webp';
import rename from 'gulp-rename';
const sass = require('gulp-sass')(require('sass'));
import critical from 'critical';
import path from 'path';
import data from 'gulp-data';
import purgeCSS from 'gulp-purgecss';
import fs from 'fs';
import rev from 'gulp-rev';
import revDelete from 'gulp-rev-delete-original';
import revRewrite from 'gulp-rev-rewrite';
const rollup = require('rollup');
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
function clean() {
    return glob(
        './www/**/*.{html,jpg,svg,webp,css,js,woff,woff2}',
        {},
        function (er, files) {
            for (let file in files) {
                rimraf(files[file], () => {});
            }
        }
    );
}

function compileNunjucks() {
    return gulp
        .src('src/*.html')
        .pipe(
            data((file) => {
                const filename = path.basename(file.path, '.html');
                let js_filename = filename;
                if (!fs.existsSync(`./src/js/${filename}.js`)) {
                    js_filename = 'default';
                }
                return {
                    filename,
                    js_filename,
                };
            })
        )
        .pipe(nunjucks.compile())
        .pipe(gulp.dest('www'));
}

function compressImages() {
    return gulp
        .src('src/img/**/*')
        .pipe(imagemin([imagemin.mozjpeg({ quality: 75, progressive: true })]))
        .pipe(gulp.dest('www/img'));
}

function createWebP() {
    return gulp
        .src('www/img/*.jpg')
        .pipe(imagemin([imageminWebp()]))
        .pipe(
            rename(function (path) {
                path.extname = '.webp';
            })
        )
        .pipe(gulp.dest('www/img'));
}

function compileSass() {
    return glob('./www/*.html', {}, function (er, files) {
        for (let file in files) {
            const filename = path.basename(files[file], '.html');
            gulp.src('./src/scss/style.scss')
                .pipe(
                    sass({ outputStyle: 'compressed' }).on(
                        'error',
                        sass.logError
                    )
                )
                .pipe(
                    rename(function (path) {
                        path.basename = filename;
                    })
                )
                .pipe(gulp.dest('./www/'));
        }
    });
}

async function bundleJavaScript() {
    return glob('./www/*.html', {}, async function (er, files) {
        for (let file in files) {
            let filename = path.basename(files[file], '.html');
            let file_path = `./src/js/${filename}.js`;
            if (!fs.existsSync(file_path)) {
                file_path = `./src/js/default.js`;
                filename = 'default';
            }
            const bundle = await rollup.rollup({
                input: file_path,
                plugins: [nodeResolve(), terser()],
            });
            await bundle.write({
                file: `./www/${filename}.js`,
                format: 'iife',
            });
        }
    });
}

function generateCriticalCSS() {
    return glob('./www/*.html', {}, function (er, files) {
        for (let file in files) {
            const filename = path.basename(files[file]);
            critical.generate({
                inline: true,
                base: 'www/',
                src: filename,
                target: filename,
                width: 1300,
                height: 900,
            });
        }
    });
}

function removeUnusedCSS() {
    return glob('./www/*.html', {}, function (er, files) {
        const safelist = {
            index: [/^ql-|^carousel|^collapsing/],
        };
        for (let file in files) {
            const filename = path.basename(files[file], '.html');
            gulp.src(`./www/${filename}.css`)
                .pipe(
                    purgeCSS({
                        content: [`./www/${filename}.html`],
                        safelist: safelist[filename],
                    })
                )
                .pipe(gulp.dest('./www/'));
        }
    });
}

function copyFonts() {
    return gulp.src('./src/fonts/*').pipe(gulp.dest('./www/fonts/'));
}

function revision() {
    return gulp
        .src('./www/**/*.+(jpg|jpeg|svg|css|js|woff|woff2)')
        .pipe(rev())
        .pipe(revDelete())
        .pipe(gulp.dest('./www/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./www/'));
}

function rewriteRefs() {
    const manifest = gulp.src('./www/rev-manifest.json');
    return gulp
        .src('./www/*.{html,css}')
        .pipe(revRewrite({ manifest }))
        .pipe(gulp.dest('./www/'));
}

const build = gulp.series(
    clean,
    compileNunjucks,
    compressImages,
    createWebP,
    compileSass,
    bundleJavaScript,
    generateCriticalCSS,
    copyFonts
);

export { clean, build, revision, rewriteRefs, removeUnusedCSS };
