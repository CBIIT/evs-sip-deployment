'use strict'

const elasticsearch = require('elasticsearch');
const config_dev = require('./server/config/dev');

//const { Client } = require('@elastic/elasticsearch')
//const client = new Client({ node: 'http://localhost:9200' })

var client = new elasticsearch.Client({
    host: config_dev.elasticsearch.host,
    log: config_dev.elasticsearch.log,
    requestTimeout: config_dev.elasticsearch.requestTimeout
});


async function run() {
    const result = await client.search({
        //index: 'evssip-suggestion',
        index: 'evssip-p',
        body: {
            "query": {
                "match": {
                    "id": {
                        //"query": "chromosome"
                        "query": "primary_site /case/case/gdc"
                    }
                    //"query": "chromosome"
                    //id: 'primary_site/case/case/gdc'
                }
            }
        }
    })

    console.log(JSON.stringify(result, null, 4))
}

run().catch(console.log)
