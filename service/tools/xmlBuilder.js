import { Builder } from 'xml2js';

export const xmlBuilder = new Builder({
    renderOpts: { 'pretty': true }
});

export const buildResponse = (formatFlag, response, statusCode, data, preTag) => {
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