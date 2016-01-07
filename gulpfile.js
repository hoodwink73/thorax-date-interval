const gulp = require('gulp');
const rename = require('gulp-rename')
const babel = require('gulp-babel');
const sass = require('gulp-sass');

gulp.task('babel-transform', function () {
	return gulp.src('src/thorax-date-interval.js')
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(gulp.dest('dist'));
});


gulp.task('sass', function () {
  gulp.src('./sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(rename('thorax-date-interval.css'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['babel-transform', 'sass'])
