require('./models/transactionModel');
require('./models/Supplier');
require('./models/Address');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = 3004;
const transactionsRoutes = require('./routes/transactionRouter');

const RedisClient = require('./cache/cacheManager');
const {
	updateAllProductsCache
} = require('./services/productsService');

const CACHE_UPDATE_TIME = '300000'

app.use(bodyParser.json());
app.use(transactionsRoutes);

main().catch((err) => console.log(err));

async function main() {
	await mongoose
		.connect('mongodb://mongo:27017/test')
		.then(() => console.log('Connected to mongo instance'));

	RedisClient.connect();
		
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
