/**
 * dev environment
 */

const elasticsearchConfig = {
  host: "http://127.0.0.1:9200",
  requestTimeout: 30000,
};

export default {
  elasticsearch: elasticsearchConfig,
};
