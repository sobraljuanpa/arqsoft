const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const router = express.Router();
var jwt = require('jsonwebtoken');
const Transaction = mongoose.model('Transaction');
const sessionValidator = require('../middleware/sessionValidator');

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
	res.status(200).send("Done.");
});

// router.put('/transaction/:id', async (req, res) => {
// });

module.exports = router;
