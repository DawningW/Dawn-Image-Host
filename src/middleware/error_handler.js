import CustomExpection from "../exception/custom_exception.js";

export default function errorHandler(options = {}) {
    return async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            let reso = {};
            if (err instanceof CustomExpection) {
                reso.code = err.code;
                reso.msg = err.message;
            } else {
                reso.code = err.status;
                reso.msg = err.message;
            }
            ctx.body = reso;
        }
    };
};
