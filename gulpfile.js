var gulp = require("gulp"),
    args = require("yargs").argv,
    del = require("del"),
    browserSync = require("browser-sync"),
    path = require("path"),
    runSequence = require("run-sequence"),
    $ = require("gulp-load-plugins")({lazy: true});

var config = require("./config")();

gulp.task("default", ["help"]);
gulp.task("help", $.taskListing);

gulp.task("clean", function (done) {
    var path = [].concat(config.build, config.css);    
    log("Cleaning: " + $.util.colors.blue(path));
    del(path, done);
});    

gulp.task("clean-fonts", function (done) {
    clean(config.build + "fonts/**/*.*", done);
});

gulp.task("clean-images", function (done) {
    clean(config.build + "images/**/*.*", done);
});

gulp.task("clean-styles", function (done) {
    clean(config.css + "**/*.css", done);
});

gulp.task("clean-code", function (done) {
    var files = [].concat(
        config.css + "**/*.css",
        config.temp + "**/*.js",
        config.build + "**/*.html",
        config.build + "js/**/*.js"
    );
    clean(files, done);
});

gulp.task("fonts", ["clean-fonts"], function () {
    log("*** Copying fonts");
    return gulp.src(config.fonts)
        .pipe(gulp.dest(config.build + "fonts"));
});    

gulp.task("images", ["clean-images"], function () {
    log("*** Copying and compressing the images");
    return gulp.src(config.images)
        .pipe($.imagemin({ optimizationLevel: 4 }))
        .pipe(gulp.dest(config.build + "images"));
});

gulp.task("styles", ["clean-styles"], function () {
    log("*** Compiling Stylus to CSS");
    return gulp.src(config.styles)
        .pipe($.plumber())
        .pipe($.stylus())
        .pipe($.autoprefixer({ browsers: ["Last 2 version", "> 5%"] }))
        .pipe(gulp.dest(config.css));
});

gulp.task("lint", function () {
    log("*** Linting all JS files"); 
    return gulp.src(config.allJs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jshint())
        .pipe($.jshint.reporter("jshint-stylish", { verbose: true }))
        .pipe($.jshint.reporter("fail"));
});

gulp.task("templatecache", ["clean-code"], function () {
    log("*** creating AngularJS $templatecache");
    return gulp.src(config.htmlTemplates)
        .pipe($.minifyHtml({ empty: true }))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.temp));
});

gulp.task("wiredep", function () {
    log("*** Wiring up bower css, js and custom js files into the index.html file");
    var wiredep = require("wiredep").stream,
        options = config.getWiredepDefaultOptions();

    return gulp.src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});

gulp.task("inject", ["wiredep", "styles", "templatecache"], function () {
    log("*** Injecting custom css files.");
    return gulp.src(config.index)
        .pipe($.inject(gulp.src(config.css + "**/*.css")))
        .pipe(gulp.dest(config.client));
});

gulp.task("optimize", ["inject", "fonts", "images"], function () {
    log("*** Optimizing the javascripts, css and html");
    var assets = $.useref.assets({ searchPath: config.root });    
    var templateCache = config.temp + config.templateCache.file;
    var cssFilter = $.filter("**/*.css", { restore: true });
    var jsLibFilter = $.filter("**/" + config.optimized.lib, { restore: true });
    var jsAppFilter = $.filter("**/" + config.optimized.app, { restore: true });

    return gulp.src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(templateCache, { read: false }), {
            starttag: "<!-- inject:templates.js -->"
        }))
        .pipe(assets)
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore)
        .pipe(jsLibFilter)
        .pipe($.uglify())
        .pipe(jsLibFilter.restore)
        .pipe(jsAppFilter)
        .pipe($.ngAnnotate())
        .pipe($.uglify())
        .pipe(jsAppFilter.restore)
        .pipe($.rev())
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.revReplace())
        .pipe(gulp.dest(config.build))
        .pipe($.rev.manifest())
        .pipe(gulp.dest(config.build));
});

gulp.task("bump", function () {
    var msg = "Bumping versions";
    var type = args.type;
    var version = args.version;
    var options = {

    };
    if (version) {
        options.version = version;
        msg += " to " + version;
    } else {
        options.type = type;
        msg += " for a " + type;
    }
    log(msg);
    return gulp.src(config.packages)
        .pipe($.bump(options))
        .pipe(gulp.dest(config.root));
});

gulp.task("serve-build", ["optimize"], function (isDev) {
    serve(false /* isDev */);
});

gulp.task("serve-dev", ["lint", "inject"], function () {
    log("*** Serving up development environment");
    serve(true /* isDev */);
});

function serve(isDev) {
    var options = {
        script: config.nodeServer,
        delayTime: 1,
        env: {
            "PORT": config.port,
            "NODE_ENV": isDev ? "dev" : "production"
        },
        watch: [config.server]
    };

    $.nodemon(options)
        .on("restart", function (ev) {
            log("*** nodemon restarted.");
            log("files changed on restart:\n" + ev);

            setTimeout(function () {
                browserSync.notify("Reloading now...");
                browserSync.reload({ stream: false });
            }, config.browserReloadDelay);
        })
        .on("start", function () {
            console.log("*** nodemon started.");
            startBrowserSync(isDev);
        })
        .on("crash", function () {
            log("*** nodemon crashed due to unexpected reason(s).");
        })
        .on("exit", function () {
            log("*** nodemon exited successfully!.");
        });
}

// Utilities Functions

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync(isDev) {
    log("*** Starting browser sync");
    if (browserSync.active || args.nosync) {
        return;
    }

    if (isDev) { 
        gulp.watch([config.styles], ["styles"])
            .on("change", function (event) { changeEvent(event); });
    } else {
        gulp.watch([config.styles, config.js, config.html], ["optimize", browserSync.reload])
            .on("change", function (event) { changeEvent(event); });
    }
    
    var options = {
        proxy: "localhost:" + config.port,
        port: 8000,
        files: isDev ? [
            config.client + "**/*.*",
            "!" + config.styles,
            config.css + "**/*.css"
        ] : [],
        ghostMode: {
            clicks: true,
            scroll: true,
            location: false,
            form: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: "debug",
        logPrefix: "gulp-bs",
        notify: true,
        reloadDelay: 1,
    };

    browserSync(options);
}

function clean(path, done) {
    del(path).then(function () {
        log("Cleaning: " + $.util.colors.blue(path));
        done();
    });
}

function log(msg) {

    if (typeof msg === "object") {
        for (var item in msg) {
            if (item.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}
