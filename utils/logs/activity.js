const redis = require('redis');
const publisher = redis.createClient({
	socket: {
		host: 'redis',
		port: 6379,
	},
});
publisher.connect();

const logActivity = async (req, res, next) => {
    let inboundTimestamp = new Date();
	res.on('finish', async function () {
		let outboundTimestamp = new Date();
		let diff =
			outboundTimestamp.getMilliseconds() - inboundTimestamp.getMilliseconds();
		await publisher.publish(
			'request',
			JSON.stringify({
				method: req.method,
				url: req.originalUrl,
				body: req.body,
				statusCode: this.statusCode,
				actor: req.user?.email,
				timetaken: diff,
				inboundTimestamp: inboundTimestamp.toUTCString(),
				outboundTimestamp: outboundTimestamp.toUTCString()
			})
		);
	});
	next();
}

module.exports = { logActivity };