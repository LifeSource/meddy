(function() {
    "use strict";

    angular
        .module("app.core")
        .config(routes);

    routes.$inject = ["$stateProvider", "$urlRouterProvider"];
    
    function routes($stateProvider, $urlRouterProvider){
       
        $stateProvider
            .state("home", {
                url: "/",
                templateUrl: "app/layout/home.html"
            });
        $urlRouterProvider.otherwise("/");
    }
})();
