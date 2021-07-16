module.exports = {
	elasticsearch: {
		host: '127.0.0.1:9200',
		log: 'error',
		requestTimeout: 30000
	},
	mysql: {
		connectionLimit: 100,
		host: 'host.docker.internal',
		port: 3306,
		user: 'root',
		password: '7323560952',
		db: 'evssip'
	}
};
