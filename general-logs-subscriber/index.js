require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
require('./models/requestLog');
require('./models/eventPublishingLog');
require('./models/eventUpdateLog');
require('./models/transactionModel');
require('./models/PaymentInfo');
const swaggerUI = require('swagger-ui-express');
const swaggerFile = require('./logs-swagger.json');
const RequestLog = mongoose.model('RequestLog');
const EventPublishingLog = mongoose.model('EventPublishingLog');
const EventUpdateLog = mongoose.model('EventUpdateLog');
const logsRoutes = require('./routes/logsRouter');
const salesRoutes = require('./routes/salesRouter');
const activityMiddleware = require('./middleware/logs/activity');

const config = process.env;
const port = config.DEPLOY_PORT;

// Redis
const redis = require('redis');
const client = redis.createClient({
	socket: {
		host: config.REDIS_HOST,
		port: config.REDIS_PORT,
	},
});

const subscriber = client.duplicate();
subscriber.connect();

subscriber.subscribe('request', async (message) => {
	let messageObject = JSON.parse(message);
	let request = new RequestLog(
		({
			method,
			url,
			body,
			statusCode,
			actor,
			timetaken,
			inboundTimestamp,
			outboundTimestamp,
		} = messageObject)
	);
	await request.save();
});

subscriber.subscribe('eventPublishing', async (message) => {
	let messageObject = JSON.parse(message);
	let event = new EventPublishingLog(
		({ eventId, publisher, timestamp } = messageObject)
	);
	await event.save();
});

subscriber.subscribe('eventUpdate', async (message) => {
	let messageObject = JSON.parse(message);
	let event = new EventUpdateLog(
		({ eventId, body, updater, timestamp } = messageObject)
	);
	await event.save();
});

// Express
const app = express();
app.use(activityMiddleware.logActivity);
app.use(logsRoutes);
app.use(salesRoutes);
app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerFile));

main().catch((err) => console.log(err));

async function main() {
	await mongoose
		.connect(config.MONGO_URL)
		.then(() => console.log('Connected to mongo instance'));

	app.listen(port, () => {
		console.log('server is listening to port 3003');
	});
}
