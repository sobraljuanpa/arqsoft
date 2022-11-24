require('dotenv').config();
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
	try {
		await mongoose
			.connect(config.MONGO_URL)
			.then(() => console.log('Connected to mongo instance'));

		app.listen(port, () => {
			console.log(`Listening on port ${port}`);
		});

		RedisClient.connect();
		updateAllProductsCache();

		setInterval(async () => {
			try {
				updateAllProductsCache();
			} catch (error) {
				console.log('Error caching products: ');
				console.log(error.message);
			}
		}, config.CACHE_UPDATE_TIME);
		
		setInterval(async () => {
			try {
				validateAllTransactionsState();
			} catch (error) {
				console.log('Error validating transactions state: ');
				console.log(error.message);
			}
		}, config.TRANSACTION_STATE_CHECK_TIME);
	} catch (error) {
		console.log(error.message);
	}
}
