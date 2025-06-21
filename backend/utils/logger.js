const {createLogger, format, transports} = require('winston');

const logger = createLogger({
    level: process.env.LOG_LEVEL  || 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports:[
        new transports.Console(), 
    ],
    exceptionHandlers: [ new transports.Console() ],
    rejectionHandlers: [ new transports.Console() ],
})

module.exports = logger;