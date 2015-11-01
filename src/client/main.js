export function configure(aurelia) {

    aurelia.use
        .standardConfiguration()
        .developmentLogging()
        .plugin("app/core/index.js");

    aurelia.start().then(a => a.setRoot("app/app.js", document.body));
}
