const redis = require('redis');
const publisher = redis.createClient({
	socket: {
		host: 'redis',
		port: 6379,
	},
});
publisher.connect();

const logEventPublishing = async (req, res, next) => {
	let timestamp = new Date().toUTCString();
	res.on('finish', async function () {
		if (req.method == 'PATCH' && this.statusCode == 200) {
			let eventId = req.originalUrl.split('/').pop();
			await publisher.publish(
				'eventPublishing',
				JSON.stringify({
					eventId: eventId,
					publisher: req.user.email,
					timestamp: timestamp,
				})
			);
		}
	});
	next();
}

const logEventUpdate = async (req, res, next) => {
	let timestamp = new Date().toUTCString();
	res.on('finish', async function () {
		if (req.method == 'PUT' && this.statusCode == 200) {
			let eventId = req.originalUrl.split('/').pop();
			await publisher.publish(
				'eventUpdate',
				JSON.stringify({
					eventId: eventId,
					body: req.body,
					updater: req.user.email,
					timestamp: timestamp,
				})
			);
		}
	});
	next();
}

module.exports = { logEventPublishing, logEventUpdate };