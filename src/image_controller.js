import * as fs from "fs";

import ImageService from "./image_service.js";

const SUPPORT_TYPES = ["image/bmp", "image/jpeg", "image/png"];

const ImageController = {
    async upload(ctx) {
        let { image } = ctx.request?.files;
        if (!image || !image.size) {
            if (image.path) fs.rmSync(image.path);
            ctx.fail(400, "请上传图片");
            return;
        }
        if (!SUPPORT_TYPES.includes(image.type)) {
            fs.rmSync(image.path);
            ctx.fail(400, "不支持此格式的图片");
            return;
        }
        let buffer = fs.readFileSync(image.path);
        fs.rmSync(image.path);
        ctx.succeed(await ImageService.upload(buffer));
    },

    async get(ctx) {
        let { name } = ctx.params;
        let { transform } = ctx.query;
        if (!name) {
            ctx.fail(400, "请选择要获取的图片");
            return;
        }
        let { image, type } = await ImageService.get(name, transform);
        ctx.body = image;
        ctx.type = type;
    },

    async delete(ctx) {
        let { id } = ctx.params;
        if (!id) {
            ctx.fail(400, "请选择要删除的图片");
            return;
        }
        ctx.succeed(await ImageService.delete(id));
    }
};

export default ImageController;
