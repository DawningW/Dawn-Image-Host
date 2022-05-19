import Router from "koa-router";

import ImageController from "./image_controller.js";

const router = new Router();
router.post("/", ImageController.upload)
    .get("/:name", ImageController.get)
    .del("/:id", ImageController.delete);

export default router;
