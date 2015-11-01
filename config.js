module.exports = function () {

    var port = process.env.PORT || 3000,
        env = process.env.NODE_ENV || "dev";

    var root = "./",
        src = root + "src/",
        client = src + "client/",
        clientApp = client + "app/",
        css = client + "css/",
        styles = client + "styles/",
        images = client + "images/",
        server = src + "server/",
        build = root + "build/",
        temp = root + "temp/",
        jspm = root + "jspm_packages/",
        nodeModules = root + "node_modules/",
        bowerComponents = root + "bower_components/",
        ignore = [nodeModules, bowerComponents];

    var config = {
        // Environment
        env: env,
        port: port,
        // Paths
        root: root,
        src: src,
        temp: temp,
        build: build,
        css: css,
        fonts: bowerComponents + "font-awesome/fonts/**/*.*",
        html: clientApp + "**/*.html",
        htmlTemplates: clientApp + "**/*.html",
        images: images + "**/*.*",
        client: client,
        clientApp: clientApp,
        styles: styles + "**/*.styl",
        server: server,
        // Files
        nodeServer: server + "server.js",
        index: client + "index.html",
        siteCss: css + "site.css",
        // JavaScripts
        allJs: [
            root + "*.js"
        ],
        js: [
            jspm + "system.js",
            client + "config.js"
        ],
        // Optimized files
        optimized: {
            app: "app.js",
            lib: "lib.js"
        },
        // Template Cache
        templateCache: {
            file: "templates.js",
            options: {
                module: "app.core",
                standAlone: false,
                root: "app/"
            }
        },
        // Bower and NPM
        nodeModules: nodeModules,
        bowerComponents: bowerComponents,
        bower: {
            json: root + "bower.json",
            directory: bowerComponents,
            ignorePath: "../.."
        },
        packages: [
            "./package.json",
            "./bower.json"
        ],
        // Browser Sync
        browserReloadDelay: 1000
    };

    config.getWiredepDefaultOptions = function () {
        var options = {
            json: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };

        return options;
    };

    return config;
};
