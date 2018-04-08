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
const sourcemaps = require('gulp-sourcemaps');
const gulpif = require('gulp-if');
const replace = require('gulp-replace');

const config = {
  isprod: false,
  dist: 'dist'
};

process.on('unhandledRejection', (up) => {
  throw up;
});

gulp.task('image', () => {
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
      '--target', 40, '--min', 30, '--max', 60],
      mozjpeg: ['-optimize', '-progressive']
    }))
    .pipe(gulp.dest( `${config.dist}/img`));
});

gulp.task('logo', () => {
  return gulp.src('img/launcher-icon.png')
    .pipe(responsive({
      '*.png': [
        {
          width: 48,
          rename: { suffix: '@48' }
        },
        {
          width: 96,
          rename: { suffix: '@96' }
        },
        {
          width: 192,
          rename: { suffix: '@192' }
        },
        {
          width: 512,
          rename: { suffix: '@512' }
        }
      ]
    }))
    .pipe(image({
      optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force']
    }))
    .pipe(gulp.dest(`${config.dist}/img`));
});

gulp.task('manifest', ['logo'], () => {
  return gulp.src('manifest.json')
    .pipe(gulp.dest(config.dist));
});

gulp.task('css', () => {
  return gulp.src(['css/mainstyles.css', 'css/detailsstyles.css'])
  .pipe(cleancss({}))
  .pipe(gulp.dest(`${config.dist}/css`));
});

gulp.task('sw', () => {
  return gulp.src('sw.js')
  .pipe(gulpif(!config.isprod, sourcemaps.init()))
  .pipe(babel({
    plugins: [
      ['transform-es2015-arrow-functions', { 'spec': true }]
    ],
    presets: ['@babel/env']
  }))
  .pipe(uglify({}))
  .pipe(gulpif(!config.isprod, sourcemaps.write()))
  .on('error', (err) => {
    gutil.log(gutil.colors.red('[Error]'), err.toString());
  })
  .pipe(gulp.dest(config.dist));
});

gulp.task('mainjs', ['mainhtml', 'sw', 'manifest'], () =>{
  return gulp.src(['node_modules/idb/lib/idb.js', 'js/app.js', 'js/dbhelper.js', 'js/main.js'])
  .pipe(gulpif(!config.isprod, sourcemaps.init()))
  .pipe(babel({
    plugins: [
      ['transform-es2015-arrow-functions', { 'spec': true }]
    ],
    presets: ['@babel/env']
  }))
  .pipe(concat({ path: 'mainbundle.js', stat: { mode: 0666 } }))
  .pipe(gulpif(config.isprod,
    replace('http://localhost:1337', 'https://mws-restaurant-sb.appspot.com')))
  .pipe(uglify({}))
  .pipe(gulpif(!config.isprod, sourcemaps.write()))
  .on('error', (err) => {
    gutil.log(gutil.colors.red('[Error]'), err.toString());
  })
  .pipe(gulp.dest(`${config.dist}/js`));
});

gulp.task('mainhtml', () => {
  return penthouse({
    url: 'http://localhost:8000',
    css: './css/mainstyles.css'
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
      .pipe(gulp.dest(config.dist));
  });
});

gulp.task('detailsjs', ['detailshtml'], () =>{
  return gulp.src(['node_modules/idb/lib/idb.js', 'js/app.js', 'js/dbhelper.js', 'js/restaurant_info.js'])
  .pipe(gulpif(!config.isprod, sourcemaps.init()))
  .pipe(babel({
    plugins: [
      ['transform-es2015-arrow-functions', { 'spec': true }]
    ],
    presets: ['@babel/env']
  }))
  .pipe(concat({ path: 'detailsbundle.js', stat: { mode: 0666 } }))
  .pipe(gulpif(config.isprod,
    replace('http://localhost:1337', 'https://mws-restaurant-sb.appspot.com')))
  .pipe(uglify({}))
  .pipe(gulpif(!config.isprod, sourcemaps.write()))
  .on('error', (err) => {
    gutil.log(gutil.colors.red('[Error]'), err.toString());
  })
  .pipe(gulp.dest(`${config.dist}/js`));
});

gulp.task('detailshtml', () => {
  return penthouse({
    url: 'http://localhost:8000/restaurant.html?id=1',
    css: './css/detailsstyles.css'
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
      .pipe(gulp.dest(config.dist));
  });
});

gulp.task('clean', function () {
  return del.sync([
    config.dist
  ]);
});

gulp.task('setprod', () => {
  config.isprod = true;
  config.dist = 'dist-prod';
});

gulp.task('prod', ['setprod', 'default']);

gulp.task('default', ['clean'], function () {
  gulp.start('image');
  gulp.start('mainjs');
  gulp.start('detailsjs');
  gulp.start('css');
});
