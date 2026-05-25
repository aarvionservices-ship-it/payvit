require("dotenv").config();
const keyLoader = require("./core/security/keyLoader");
keyLoader.loadKeys();

const app = require("./app");
const connectDB = require("./core/database/mongoose.connection");

const PORT = process.env.PORT || 5000;

async function start() {

    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
    });

}

start();