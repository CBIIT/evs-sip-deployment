/**
 * dev environment
 */

module.exports = {
	elasticsearch: {
		host: '127.0.0.1:9200',
		log: 'error',
		requestTimeout: 30000
	},

	mysql: {
		connectionLimit: 100,
		host: 'localhost',
		port: 3306,
		user: 'root',
		password: '7323560952',
		db: 'evssip'
	},
	neo4j:{
		NEO4J_DATABASE_USERNAME:"neo4j",
		NEO4J_DATABASE_PASSWORD:"humidity-initiator-adhesives",
		NEO4J_DATABASE_URL:"bolt://localhost:7687"
	}
};