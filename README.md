# EVS-SIP Backend

## Introduction

This project contains EVS-SIP's API services and Swagger documentation.

## Prerequisites

- Elasticsearch 7.x
- Java
- Neo4j

## How to run this application

Follow the steps below to run this project:

### Configure environment

Make a copy of `.env.example` and name it `.env`.

Edit the values in `.env` to suit your deployment environment.

The value of `NODE_ENV` corresponds to one of the following configuration files in `routes/`:

- `dev.js`
- `qa.js`
- `stage.js`
- `prod.js`

### Configure Elasticsearch

Check your Elasticsearch installation's `elasticsearch.yml` to make sure it uses the port specified in the configuration file that corresponds to `NODE_ENV`.

### Run Elasticsearch

Whether you're spinning up a container or executing `bin/elasticsearch`, get your Elasticsearch service running.

### Run Neo4j

Get Neo4j running for this application's `/api/datamodel/...` endpoints.

### Run project

Execute the command `npm run start-backend`.

### Build Elasticsearch index

Before you use certain endpoints like `/api/search`, you must build the Elasticsearch index. For example, if your application is running locally on port 3000, then run the following command:

```bash
curl http://localhost:3000/service/search/buildIndex
```
