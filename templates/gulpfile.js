'use strict';

var gulp = require('gulp'),
    spritesmith = require('gulp.spritesmith'),
    imagemin = require('gulp-imagemin'),
    open = require('gulp-open'),
    browserSync = require('browser-sync'),
    minimist = require('minimist'),
    sass = require('gulp-sass'),
    csso = require('gulp-csso'),
    rename = require('gulp-rename'),
    cssimport = require('gulp-cssimport'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    filter = require('gulp-filter'),
    fileInclude = require('gulp-file-include'),
    clean = require('gulp-clean');

/**
 * 导入应用配置信息，运行下面所有命令时，都依赖于APP配置信息
 * 例如：gulp sprite:normal --app ./dev/blog-pc/config.js
 */
var knownOptions = {
    string: 'app'
};
var appConfig = require(minimist(process.argv.slice(2), knownOptions).app);
// console.log(appConfig);

var imgFilter = filter('*.+(png|jpg|jpeg|gif|svg)', {restore:true});

/**
 * sprite总命令
 */
gulp.task('sprite:normal', ['sprite:icon', 'sprite:min'], function() {});
gulp.task('sprite:retina', ['sprite:logo', 'sprite:min'], function() {});
// 创建雪碧图
gulp.task('sprite:icon', function() {
    var spriteData = gulp.src(appConfig.sprite.icon.src) // source path of the sprite images
        .pipe(imgFilter)
        .pipe(spritesmith(
            appConfig.sprite.icon
        ));
    spriteData.img.pipe(gulp.dest(appConfig.sprite.spritesOutputPath)); // output path for the sprite
    spriteData.css.pipe(gulp.dest(appConfig.sprite.spritesOutputPath)); // output path for the CSS
});
// 创建雪碧图
gulp.task('sprite:logo', function() {
    var spriteData = gulp.src(appConfig.sprite.logo.src) // source path of the sprite images
        .pipe(imgFilter)
        .pipe(spritesmith(
            appConfig.sprite.logo
        ));
    spriteData.img.pipe(gulp.dest(appConfig.sprite.spritesOutputPath)); // output path for the sprite
    spriteData.css.pipe(gulp.dest(appConfig.sprite.spritesOutputPath)); // output path for the CSS
});
// 压缩雪碧图
gulp.task('sprite:min', function() {
    return gulp.src(appConfig.sprite.spritesOutputPath + '/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
    .pipe(imagemin({
        interlaced: true,
    }))
    .pipe(gulp.dest(appConfig.sprite.spritesOutputPath))
});
// 打开文件目录
gulp.task('sprite:open', function() {
    gulp.src('')
    .pipe(open({app: 'Finder', uri: appConfig.sprite.spritesOutputPath}));
});

// 压缩图片
gulp.task('image:min', function() {
    return gulp.src(appConfig.sprite.image.src + '/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
    .pipe(imagemin({
        interlaced: true,
    }))
    .pipe(gulp.dest(appConfig.sprite.image.dest));
});

/**
 * browser-sync自动刷新
 */
gulp.task('server', function() {
    if (!appConfig.server.isProxy) {
        gulp.run('server:static');
    } else {
        gulp.run('server:proxy');
    }
});

var serverConf = {};
if (appConfig.isDev) {
    serverConf.dir = appConfig.server.devDir;
    serverConf.files = appConfig.server.devFiles;
} else {
    serverConf.dir = appConfig.server.productionDir;
    serverConf.files = appConfig.server.productionFiles;
}
// 使用内置的静态服务器
gulp.task('server:static', function() {
    browserSync({
        // 从这个项目的根目录下面的dev目录启动服务器
        server: {
            baseDir: serverConf.dir
        },
        reloadDelay: 500 // 设置延迟是因为监听文件变化需要
    });
});
// 使用代理服务器
gulp.task('server:proxy', function() {
    browserSync({
        // 设置代理
        proxy: appConfig.server.proxy, // 你的域名或IP
        files: serverConf.files, // 自动刷新监听的文件
        reloadDelay: 500
    });
});

/**
 * CSS处理
 * 编译sass, 压缩css
 */
var cssimportOptions = {};
gulp.task('css', function(){
    return gulp.src(appConfig.css.sass.src + '/**/*.scss')
        .pipe(sass())
        .pipe(cssimport(cssimportOptions))
        .pipe(gulp.dest(appConfig.css.src))
        .pipe(rename({suffix: '.min'}))
        .pipe(csso())
        .pipe(gulp.dest(appConfig.css.dest));
});
gulp.task('css-watch', ['css'], browserSync.reload);
/**
 * JavaScript处理
 */
gulp.task('js', function(){
    return gulp.src(appConfig.js.src + '/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest(appConfig.js.dest));
});
gulp.task('js-watch', ['js'], browserSync.reload);

/**
 * html, file include
 */
gulp.task('html', function() {
    gulp.src(appConfig.html.src + '/*.html')
        .pipe(fileInclude({
          prefix: '@@',
          basepath: '@file'
        }))
    .pipe(gulp.dest(appConfig.html.dest));
});
/**
 * file clean
 */
gulp.task('clean',function(){
    gulp.src('./dist/' + appConfig.appName + '/').pipe(clean());
});
/**
 * watch
 */
gulp.task('watch', ['clean', 'sprite:normal', 'css', 'js', 'html', 'image:min', 'server'], function() {
    gulp.watch(appConfig.css.sass.src + '/*.scss', ['css-watch'])
    gulp.watch(appConfig.js.src + '/*.js', ['js-watch'])
    gulp.watch(appConfig.sprite.image.src + '/**/*.+(png|jpg|jpeg|gif|svg)', ['image:min'])
    gulp.watch(appConfig.sprite.icon.src + '/**/*.+(png|jpg|jpeg|gif|svg)', ['sprite:normal'])
    gulp.watch(appConfig.html.listen).on('change', browserSync.reload);
});

