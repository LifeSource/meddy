export class App {

    configureRouter(config, router) {
        this.router = router;

        config.map([
            {
                route: ["", "home"],
                title: "Home",
                name: "Home",
                moduleId: "app/doctor/doctor",
                nav: true
            },
            {
                route: "about",
                title: "About",
                name: "About",
                moduleId: "about/about",
                nav: true
            }

        ]);
    }
}
