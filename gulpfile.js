const gulp = require('gulp');
const image = require('gulp-image');
const responsive = require('gulp-responsive');
const del = require('del');

process.on('unhandledRejection', (up) => {
  throw up;
});

gulp.task('image', function () {
  return gulp.src('imgsrc/*.{png,jpg}')
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
