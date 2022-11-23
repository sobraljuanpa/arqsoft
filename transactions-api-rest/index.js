require('dotenv').config()
require('./models/transactionModel');
require('./models/Supplier');
require('./models/Address');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUI = require('swagger-ui-express');
const swaggerFile = require('./transactions-swagger.json');
const activityMiddleware = require('./sharedMiddleware/logs/activity');
const config = process.env;

const app = express();
const port = config.DEPLOY_PORT;
const transactionsRoutes = require('./routes/transactionRouter');

const RedisClient = require('./cache/cacheManager');
const { updateAllProductsCache } = require('./services/productsService');

const {
	validateAllTransactionsState,
} = require('./services/transactionService');

app.use(bodyParser.json());
app.use(activityMiddleware.logActivity);
app.use(transactionsRoutes);
app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerFile));

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

	//TODO: Capaz esto moverlo para algun lado como "tareas recurrentes"
	setInterval(async () => {
		try {
			validateAllTransactionsState();
			updateAllProductsCache();
		} catch (error) {
			console.log('Error caching products');
			console.log(error);
		}
	}, config.CACHE_UPDATE_TIME);
}
