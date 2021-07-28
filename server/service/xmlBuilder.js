const xml = require('xml2js')

const xmlBuilder = new xml.Builder({
    renderOpts: { 'pretty': true }
});


const buildResponse = (formatFlag, response, statusCode, data, preTag) => {
    if (formatFlag === 'xml') {
        return response.status(statusCode).send(xmlBuilder.buildObject({ [preTag]: data }));
    } else {
        return response.status(statusCode).json(data);
    }
};

const buildResponseFromRes = (response, statusCode, data, preTag) => {
    response.format({
        'application/xml': () => {
            return response.status(statusCode).send(xmlBuilder.buildObject({ [preTag]: data }));
        },
        'application/json': () => {
            return response.status(statusCode).json(data);
        },
        'default': () => {
            // log the request and respond with 406
            return response.status(406).send('Not Acceptable');
        }
    });
};

module.exports = {
    buildResponse,
    xmlBuilder,
};
