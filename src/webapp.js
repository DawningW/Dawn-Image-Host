import Koa from "koa";
import Router from "koa-router";
import koaLogger from "koa-logger";
import koaCors from "koa2-cors";
import koaBody from "koa-body";

import config from "../config.js";
import errorHandler from "./middleware/error_handler.js";
import response from "./middleware/response.js";
import ImageRouter from "./image_router.js";

export const app = new Koa();
const router = new Router();
router.get("/", async ctx => {
    ctx.type = "html";
    ctx.body = `此项目仅包括图床服务</br>完整API文档请见: <a href="${config.doc}">${config.doc}</a>`;
}).use("/image", ImageRouter.routes(), ImageRouter.allowedMethods());

app.use(koaLogger());
app.use(errorHandler());
app.use(response());
app.use(koaCors({
    origin: "*"
}));
app.use(koaBody({
    multipart: true,
    formidable: {
        maxFileSize: 8 * 1024 * 1024
    }
}));
app.use(router.routes());
app.use(router.allowedMethods({ throw: true }));
