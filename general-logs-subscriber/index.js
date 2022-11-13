const express = require('express');
const mongoose = require('mongoose');
require('./models/requestLog');
require('./models/eventPublishingLog');
require('./models/eventUpdateLog');
const RequestLog = mongoose.model('RequestLog');
const EventPublishingLog = mongoose.model('EventPublishingLog');
const EventUpdateLog = mongoose.model('EventUpdateLog');

// Redis
const redis = require('redis');
const client = redis.createClient({
	socket: {
		host: 'redis',
		port: 6379,
	},
});
const subscriber = client.duplicate();
subscriber.connect();

subscriber.subscribe('request', async (message) => {
	let messageObject = JSON.parse(message);
	let request = new RequestLog(
		({ method, url, body, statusCode, timetaken, timestamp } = messageObject)
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
// Todavia falta los endpoints para consultar logs
app.get('/', (req, res) => {
	res.send('Subscriber One');
});

main().catch((err) => console.log(err));

async function main() {
	await mongoose
		.connect('mongodb://mongo:27017/test')
		.then(() => console.log('Connected to mongo instance'));

	app.listen(3003, () => {
		console.log('server is listening to port 3003');
	});
}
