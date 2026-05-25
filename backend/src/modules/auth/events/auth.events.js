const eventBus = require("../../../core/eventBus");

eventBus.on("user.registered", (user) => {

    console.log("User registered event:", user.email);

});

eventBus.on("user.login", (user) => {

    console.log("User login event:", user.email);

});
