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

const app = express();
const port = 3000;
// configuro middleware
app.use(bodyParser.json());
app.use(activityMiddleware.logActivity); //importante configurar middleware antes de las rutas si no se lo saltea
app.use(eventsMiddleware.logEventUpdate);
app.use(eventsMiddleware.logEventPublishing);
app.use(eventsRoutes);
app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerFile));

main().catch((err) => console.log(err));

async function main() {
	await mongoose
		.connect('mongodb://mongo:27017/test')
		.then(() => console.log('Connected to mongo instance'));

	app.listen(port, () => {
		console.log(`Listening on port ${port}`);
	});
}
