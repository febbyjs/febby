/*!
 * febby
 * Copyright(c) 2017 Vasu Vanka
 * MIT Licensed
 */
/**
 * @private
 * Class Represents custom Errors
 */
class Cerror {
    /**
     * create an error class object
     */
    constructor() {}

    /**
     * @description Returns 400 error
     */
    get400() {
        return this.getError(400, 'INVALID CONTENT');
    }

    /**
     * @description Returns 403 error
     */
    get403() {
        return this.getError(403, 'FORBIDDEN');
    }

    /**
     * @description Returns 404 error
     */
    get404() {
        return this.getError(404, 'NOT FOUND');
    }

    /**
     * @description Returns 405 error
     */
    get405() {
        return this.getError(405, 'METHOD NOT ALLOWED');
    }

    /**
     *
     * @param {number} status
     * @param {string} message
     * @description Returns custom error object
     */
    getError(status, message) {
        let err = new Error(message || 'UNKNOWN ERROR');
        err.status = status || 500;
        return err;
    }
}

module.exports = Cerror;
