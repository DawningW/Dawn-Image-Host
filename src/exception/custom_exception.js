export default class CustomException extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.status = 200;
        this.expose = true;
    }
}
