const gulp = require('gulp');
const image = require('gulp-image');
const responsive = require('gulp-responsive');
const cleancss = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const del = require('del');
const gutil = require('gulp-util');
const babel = require('gulp-babel');
const htmlreplace = require('gulp-html-replace');
const htmlmin = require('gulp-htmlmin');
const penthouse = require('penthouse');

process.on('unhandledRejection', (up) => {
  throw up;
});

gulp.task('image', function () {
  return gulp.src('img/*.jpg')
    .pipe(responsive({
      '*.jpg': [
        {
          width: 400,
          rename: { suffix: '@400' }
        },
        { width: 550,
          rename: { suffix: '@550' }
        },
        {
          width: 800
        }
      ]
    }))
    .pipe(image({
      jpegRecompress: ['--strip', '--quality', 'medium',
      '--min', 40, '--max', 60],
      mozjpeg: ['-optimize', '-progressive']
    }))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('css', () => {
  return gulp.src('css/styles.css')
  .pipe(cleancss({}))
  .pipe(gulp.dest('dist/css'));
});

gulp.task('sw', () => {
  return gulp.src('sw.js')
  .pipe(babel({
    plugins: [
      ['transform-es2015-arrow-functions', { 'spec': true }]
    ],
    presets: ['@babel/env']
  }))
  .pipe(uglify({}))
  .on('error', (err) => {
    gutil.log(gutil.colors.red('[Error]'), err.toString());
  })
  .pipe(gulp.dest('dist/'));
});

gulp.task('mainjs', ['mainhtml', 'sw'], () =>{
  return gulp.src(['node_modules/idb/lib/idb.js', 'js/app.js', 'js/dbhelper.js', 'js/main.js'])
  .pipe(babel({
    plugins: [
      ['transform-es2015-arrow-functions', { 'spec': true }]
    ],
    presets: ['@babel/env']
  }))
  .pipe(concat({ path: 'mainbundle.js', stat: { mode: 0666 } }))
  .pipe(uglify({}))
  .on('error', (err) => {
    gutil.log(gutil.colors.red('[Error]'), err.toString());
  })
  .pipe(gulp.dest('dist/js'));
});

gulp.task('mainhtml', () => {
  return penthouse({
    url: 'http://localhost:8000',
    css: './css/styles.css'
  })
  .then((criticalCss) => {
    return gulp.src('index.html')
      .pipe(htmlreplace({
        'js': 'js/mainbundle.js',
        'criticalCSS': {
          src: criticalCss,
          tpl: '<style>%s</style>'
        }
      }))
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest('dist'));
  });
});

gulp.task('detailsjs', ['detailshtml'], () =>{
  return gulp.src(['node_modules/idb/lib/idb.js', 'js/app.js', 'js/dbhelper.js', 'js/restaurant_info.js'])
  .pipe(babel({
    plugins: [
      ['transform-es2015-arrow-functions', { 'spec': true }]
    ],
    presets: ['@babel/env']
  }))
  .pipe(concat({ path: 'detailsbundle.js', stat: { mode: 0666 } }))
  .pipe(uglify({}))
  .on('error', (err) => {
    gutil.log(gutil.colors.red('[Error]'), err.toString());
  })
  .pipe(gulp.dest('dist/js'));
});

gulp.task('detailshtml', () => {
  return penthouse({
    url: 'http://localhost:8000/restaurant.html?id=1',
    css: './css/styles.css'
  })
  .then((criticalCss) => {
    return gulp.src('restaurant.html')
      .pipe(htmlreplace({
        'js': 'js/detailsbundle.js',
        'criticalCSS': {
          src: criticalCss,
          tpl: '<style>%s</style>'
        }
      }))
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest('dist'));
  });
});

gulp.task('clean', function () {
  return del.sync([
    'dist'
  ]);
});

gulp.task('default', ['clean'], function () {
  gulp.start('image');
  gulp.start('mainjs');
  gulp.start('detailsjs');
  gulp.start('css');
});
