const eventBus = require("../../../core/eventBus");

eventBus.on("lead.created", (lead) => {

    console.log("New lead captured", lead.leadId);

});

eventBus.on("lead.assigned", (data) => {

    console.log("Lead assigned", data);

});
