const gulp = require('gulp');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const sass = require('gulp-sass');


gulp.task('babel-amd-transform', function () {
	return gulp.src('src/thorax-date-interval.js')
		.pipe(babel({
			presets: ['es2015'],
			plugins: ['transform-es2015-modules-amd']
		}))
		.pipe(rename(function (path) {
			path.basename += '.amd'
		}))
		.pipe(gulp.dest('dist'));
});

gulp.task('copy-to-dist', function () {
	return gulp.src('src/thorax-date-interval.js')
		.pipe(rename(function (path) {
			path.basename += '.es6'
		}))
		.pipe(gulp.dest('dist/'))
})

gulp.task('sass', function () {
  gulp.src('./sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(rename('thorax-date-interval.css'))
    .pipe(gulp.dest('./dist/'));
});


gulp.task('build', ['copy-to-dist', 'babel-amd-transform', 'sass'])
