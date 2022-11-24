require('dotenv').config();
require('./models/Supplier');
require('./models/eventModel');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUI = require('swagger-ui-express');
const swaggerFile = require('./events-swagger.json');

const eventsRoutes = require('./routes/eventsRouter');
const activityMiddleware = require('./middleware/logs/activity');
const eventsMiddleware = require('./middleware/logs/events');
const config = process.env;

const app = express();
const port = config.DEPLOY_PORT;

app.use(bodyParser.json());
app.use(activityMiddleware.logActivity);
app.use(eventsMiddleware.logEventUpdate);
app.use(eventsMiddleware.logEventPublishing);
app.use(eventsRoutes);
app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerFile));

main().catch((err) => console.log(err));

async function main() {
	await mongoose
		.connect(config.MONGO_URL)
		.then(() => console.log('Connected to mongo instance'));

	app.listen(port, () => {
		console.log(`Listening on port ${port}`);
	});
}
