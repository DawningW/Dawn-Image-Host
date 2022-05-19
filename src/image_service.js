import * as fs from "fs";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import jimp from "jimp"; // jimp绘制文本功能较弱
import { createCanvas, GlobalFonts, Image } from "@napi-rs/canvas"; // canvas操作图像较困难

import { imageCache, imageTimer, subExpired } from "./database.js";
import CustomException from "./exception/custom_exception.js";

const SUPPORT_TYPES = ["jpeg", "png"];
const EXPIRE_TIME = 3 * 3600; // 缓存默认过期时间3h

GlobalFonts.register(fs.readFileSync("./fonts/SourceHanSans-Regular.ttf"), "Source Han Sans");

function calcMD5(buffer) {
    return createHash("md5").update(buffer).digest("hex");
}

function parseName(str) {
    let index = str.lastIndexOf(".");
    if (index < 0) {
        return [str, "jpeg"];
    }
    let prefix = str.slice(index + 1);
    if (prefix == "jpg") prefix = "jpeg";
    return [str.slice(0, index), prefix];
}

function parseTransform(str) {
    let transforms = {};
    let params = str.split(",");
    for (let param of params) {
        let [key, value] = param.split("_", 2);
        switch (key) {
            case "w":
                transforms.width = parseInt(value);
                break;
            case "h":
                transforms.height = parseInt(value);
                break;
            case "s":
                transforms.scale = parseFloat(value);
                break;
            case "r":
                transforms.rotate = parseInt(value);
                break;
            case "f":
                transforms.filp = value;
                break;
            case "wm":
                transforms.watermark = value;
                break;
            case "wmx":
                transforms.wm_x = parseInt(value);
                break;
            case "wmy":
                transforms.wm_y = parseInt(value);
                break;
            case "wms":
                transforms.wm_size = parseInt(value);
                break;
            default:
                break;
        }
    }
    return transforms;
}

function applyScale(image, transforms) {
    if ((transforms.width || transforms.height) && transforms.scale) {
        throw new CustomException(400, "按尺寸缩放和按比例缩放不能同时存在");
    }
    let width = image.getWidth();
    let height = image.getHeight();
    if (transforms.width || transforms.height) {
        width = transforms.width ?? jimp.AUTO;
        height = transforms.height ?? jimp.AUTO;
        if (width > 8000 || height > 8000) {
            throw new CustomException(400, "图像变换尺寸过大或无效");
        }
        image.resize(width, height);
    } else if (transforms.scale) {
        width *= transforms.scale;
        height *= transforms.scale;
        if (width > 8000 || height > 8000) {
            throw new CustomException(400, "图像变换尺寸过大或无效");
        }
        image.scale(transforms.scale);
    }
}

function applyRotateOrFilp(image, transforms) {
    if (transforms.rotate && transforms.filp) {
        throw new CustomException(400, "旋转和翻转同时只能存在一个");
    }
    if (transforms.rotate) {
        let rotate = transforms.rotate;
        if (![90, 180, 270].includes(rotate)) {
            throw new CustomException(400, "无效的旋转角度");
        }
        image.rotate(rotate);
    }
    if (transforms.filp) {
        let filp = transforms.filp;
        if (filp === "h") {
            image.flip(true, false);
        } else if (filp === "v") {
            image.mirror(false, true);
        } else {
            throw new CustomException(400, "无效的翻转方向");
        }
    }
}

function applyWatermark(ctx, transforms) {
    let text = transforms.watermark;
    let x = transforms.wm_x ?? 0;
    let y = transforms.wm_y ?? 0;
    let size = transforms.wm_size ?? 24;
    ctx.fillStyle = "black";
    // ctx.strokeStyle = "white";
    ctx.textBaseline = "top";
    ctx.font = `${size}px Source Han Sans`;
    ctx.fillText(text, x, y);
    // ctx.strokeText(text, x, y);
}

subExpired(imageTimer, async (key) => {
    let uuid = await imageCache.get(key);
    fs.rmSync(`./cache/${uuid}`);
    await imageCache.del(key);
});

const ImageService = {
    async upload(src) {
        let image = await jimp.read(src);
        if (image.getWidth() > 8000 || image.getHeight() > 8000) {
            throw new CustomException(400, "图像太大");
        }
        let buffer = await image.getBufferAsync("image/jpeg");
        let id = calcMD5(buffer);
        let fileName = `./images/${id}.jpg`;
        if (!fs.existsSync(fileName)) {
            fs.writeFileSync(fileName, buffer);
        }
        return { id };
    },

    async get(name, transform) {
        // 解析文件名
        let [id, prefix] = parseName(name);
        let fileName = `./images/${id}.jpg`;
        if (!fs.existsSync(fileName)) {
            throw new CustomException(400, "图像不存在");
        }
        if (!SUPPORT_TYPES.includes(prefix)) {
            throw new CustomException(400, "不支持此格式");
        }
        // 从缓存中读取或生成图片
        let buffer;
        if (prefix != "jpeg" || transform) {
            // 检查缓存是否存在
            let key = name + "@" + transform;
            if (await imageTimer.exists(key)) {
                // 从缓存中读取
                let uuid = await imageCache.get(key);
                buffer = fs.readFileSync(`./cache/${uuid}`);
                await imageTimer.expire(key, EXPIRE_TIME);
            } else {
                // 进行转码和变换操作
                let image = await jimp.read(fileName);
                let transforms;
                if (transform) {
                    // 变换: 包括缩放, 旋转, 加水印等
                    transforms = parseTransform(transform);
                    applyScale(image, transforms);
                    applyRotateOrFilp(image, transforms);
                }
                buffer = await image.getBufferAsync(`image/${prefix}`);
                if (transforms?.watermark) {
                    // 由于jimp绘制文本功能较弱, 改用canvas绘制文本
                    let image = new Image();
                    image.src = buffer;
                    let canvas = createCanvas(image.width, image.height);
                    let ctx = canvas.getContext("2d");
                    ctx.drawImage(image, 0, 0);
                    applyWatermark(ctx, transforms);
                    buffer = canvas.encodeSync(prefix);
                }
                // 保存到缓存中
                let uuid = uuidv4();
                fileName = `./cache/${uuid}`;
                if (!fs.existsSync(fileName)) {
                    fs.writeFileSync(fileName, buffer);
                }
                await imageCache.set(key, uuid);
                await imageTimer.set(key, "-", "EX", EXPIRE_TIME);
            }
        } else {
            // 未转码和变换, 直接读取
            buffer = fs.readFileSync(fileName);
        }
        // 返回图片
        return {
            image: buffer,
            type: `image/${prefix}`
        }
    },

    async delete(id) {
        let fileName = `./images/${id}.jpg`;
        if (!fs.existsSync(fileName)) {
            throw new CustomException(400, "图像不存在");
        }
        fs.rmSync(fileName);
    }
};

export default ImageService;
