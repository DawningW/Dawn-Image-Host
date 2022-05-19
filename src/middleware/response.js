import statuses from "statuses";

export default function response(options = {}) {
    return async (ctx, next) => {
        ctx.succeed = (data) => {
            ctx.body = {
                code: 0,
                msg: "成功",
                data: data
            };
        };
        ctx.fail = (code, msg) => {
            ctx.body = {
                code: code,
                msg: msg
            };
        };
        await next();
        if (ctx.status === 404) {
            ctx.status = 404;
            ctx.fail(ctx.status, statuses[ctx.status]);
        }
    };
};
