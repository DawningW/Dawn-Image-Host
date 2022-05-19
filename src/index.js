import config from "../config.js";
import { imageCache, imageTimer } from "./database.js";
import { app } from "./webapp.js";

Promise.all([
    imageCache.connect(),
    imageTimer.connect()
]).then(connections => {
    console.log("Connect to database successfully.");
    app.listen(config.port, () => {
        console.log(`Dawncraft API Server is listening at port ${config.port}!`);
    });
}).catch(reason => {
    console.log(`Can't connect to database, ${reason}`);
    process.exit(0);
});
