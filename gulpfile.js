const gulp = require('gulp');
const image = require('gulp-image');
const responsive = require('gulp-responsive');
const del = require('del');

gulp.task('image', function () {
  return gulp.src('imgsrc/*.{png,jpg}')
    .pipe(responsive({
      '*.jpg': [
        { width: 200,
          rename: { suffix: '@200' }
        },
        {
          width: 400,
          rename: { suffix: '@400' }
        },
        {
          width: 800
        }
      ]
    }))
    .pipe(image())
    .pipe(gulp.dest('img'));
});

gulp.task('clean', function () {
  return del([
    'img'
  ]);
});

gulp.task('default', ['clean'], function () {
  gulp.start('image');
});
