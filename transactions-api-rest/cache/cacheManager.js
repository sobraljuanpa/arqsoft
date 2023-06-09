const Redis = require('redis');
const RedisClient = Redis.createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT,
	},
});

// se conecta a bd por defecto, se puede especificar en que base de datos/puerto se crea la instancia.
RedisClient.on('connect', function () {
	console.log('Cliente conectado');
});

RedisClient.on('error', function (err) {
	console.log('Error =>', err);
});

module.exports = RedisClient;
