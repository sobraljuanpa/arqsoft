require('./models/Supplier');
require('./models/eventModel');
require('./models/userModel');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const RedisClient = require('./cache/cacheManager');
const {
	updateAllProductsCache
} = require('./services/productsService');

const CACHE_UPDATE_TIME = '300000'

const eventsRoutes = require('./routes/eventsRouter');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(eventsRoutes);

main().catch((err) => console.log(err));

async function main() {
	await mongoose
		.connect('mongodb://mongo:27017/test')
		.then(() => console.log('Connected to mongo instance'));

	await RedisClient.connect();

	app.listen(port, () => {
		console.log(`Listening on port ${port}`);
	});

	updateAllProductsCache();
	setInterval(async () => {
		try {
			updateAllProductsCache();
		} catch (error) {
			console.log('Error caching products');
			console.log(error);
		}
	}, CACHE_UPDATE_TIME)
}
