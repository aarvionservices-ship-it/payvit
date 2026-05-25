const Click = require("../model/affiliateClick.model");

class ClickRepository {

    async createClick(data) {
        return Click.create(data);
    }

}

module.exports = new ClickRepository();
