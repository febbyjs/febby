/*!
 * febby
 * Copyright(c) 2017 Vasu Vanka
 * MIT Licensed
 */
/**
 * @ignore
 * Class representing mongodb Connection
 */
class Connection {
    /**
     *
     * Create a Connection to mongodb
     * @param {Object} mongoose - mongoose object will be passed to create a connection object.
     */
    constructor(mongoose) {
        this.mongoose = mongoose;
    }

    /**
     * Establish a connection to mongodb server using given url
     * @param {string} url  - Mongodb connection url
     * @returns {Promise.<Object|Error>} will return mongoose connection promise
     */
    createConnection(url) {
        let options = {
            useMongoClient: true,
            autoIndex: true, // Don't build indexes
            reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
            reconnectInterval: 500, // Reconnect every 500ms
            poolSize: 10, // Maintain up to 10 socket connections
            // If not connected, return errors immediately rather than waiting for reconnect
            bufferMaxEntries: 0
        };
        return this.mongoose.connect(url, options);
    }

    /**
     * To Destroy created mongodb connection
     */
    destroyConnection() {
        this.mongoose.connection.close();
    }
}

module.exports = Connection;
