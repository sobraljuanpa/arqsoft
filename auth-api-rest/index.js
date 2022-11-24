require('dotenv').config()
require('./models/userModel');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUI = require('swagger-ui-express');
const swaggerFile = require('./auth-swagger.json');

const app = express();
const port = process.env.DEPLOY_PORT;
const authRoutes = require('./routes/authRouter');
const activityMiddleware = require('./utils/logs/activity');

app.use(bodyParser.json());
app.use(activityMiddleware.logActivity);
app.use(authRoutes);
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
