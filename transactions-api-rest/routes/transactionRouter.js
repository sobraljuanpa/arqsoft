const express = require('express');
const mongoose = require('mongoose');
var expressQueue = require('express-queue');
const fs = require('fs');
const router = express.Router();
var jwt = require('jsonwebtoken');
const Transaction = mongoose.model('Transaction');
const sessionValidator = require('../middleware/sessionValidator');
const Pipeline = require('pipes-and-filters');
const axios = require('axios');

const pipeline = Pipeline.create('Transaction validations');

const validate_mail = function (input, next) {};

const validate_CI = function (input, next) {};

const validate_stock = function (input, next) {};

pipeline.use(validate_mail);
pipeline.use(validate_CI);
pipeline.use(validate_stock);

router.post('/transaction', async (req, res) => {
	// our transaction logic goes here...
	try {
		// Get user input
		const { name, birthdate, country } = req.body;

		// Validate user input
		if (!(name && birthdate && country)) {
			res.status(400).send('Campos incompletos');
		}

		// Create transaction in our database
		// TODO: Encrypt password
		const transaction = await Transaction.create({
			name,
			birthdate,
			country, // sanitize: convert email to lowercase
			status: 'En proceso',
		});
		// TODO: Evaluar si esto es necesario, me parece que no. Que haga login siempre.
		const PRIVATE_KEY = fs.readFileSync('./keys/private.key', 'utf8');
		const token = jwt.sign(
			JSON.stringify(transaction),
			PRIVATE_KEY,
			{
				algorithm: 'RS256',
			},
			{
				expiresIn: '15m',
			}
		);
		const response = { sessionToken: token };
		res.status(201).json(response);
	} catch (err) {
		console.log(err);
	}
});

router.get('/test', sessionValidator, async (req, res) => {
	res.status(200).send('Done.');
});

const queueMw = expressQueue({ activeLimit: 1, queuedLimit: 100000 });

// Hacer que sea configurable el limite
router.post('/buy', queueMw, async (req, res) => {
	try {
		const stock = req.query.stock;
		const product = await axios.put(
			'http://suppliers-products-mock-api-rest:3005/supplier/1/product/637937926c6157f5991e4310',
			{},
			{ params: { stock: stock } }
		);
		res.status(200).send('test');
	} catch (error) {
		console.log(error);
	}
});

// router.put('/transaction/:id', async (req, res) => {
// });

module.exports = router;
