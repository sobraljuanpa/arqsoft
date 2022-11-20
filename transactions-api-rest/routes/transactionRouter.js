const express = require('express');
const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');
const Supplier = mongoose.model('Supplier');
var expressQueue = require('express-queue');
const fs = require('fs');
const router = express.Router();
var jwt = require('jsonwebtoken');
const sessionValidator = require('../middleware/sessionValidator');
const ciValidator = require('ciuy');
const Pipeline = require('pipes-and-filters');
const axios = require('axios');
const {
	updateAllProductsCache,
	getProductsByEvent
} = require('../services/productsService');

const pipeline = Pipeline.create('Transaction validations');

const validate_mail = function (input, next) {
	const regex = /\S+@\S+\.\S+/;
	if (regex.test(input.email)) {
		next(null, input);
	} else {
		return next(Error('Invalid email address'));
	}
};

const validate_CI = function (input, next) {
	if (ciValidator.validateIdentificationNumber(input.ci)) {
		next(null, input);
	} else {
		return next(Error('Invalid CI'));
	}
};

const validate_stock = function (input, next) {
	//hay que validar stock, mismo formato que las anteriores
};

pipeline.use(validate_mail);
pipeline.use(validate_CI);
//pipeline.use(validate_stock);

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

router.post('/purchase', sessionValidator, async (req, res) => {
	//que venga en el body ademas de lo por letra, providerId y productId
	// validar body completo
	// pasar por el pipe

	/**
	 * {product: { productId: number, supplierEmail: string, eventId, quantity: number }, email: string, ci:string}
	 */

	pipeline.execute(req.body, async function (err, result) {
		if (err) {
			console.log(err.message);
			res.status(400).send(err.message);
		} else {
			try {
				const selectedProduct = req.body.product;
				// Find supplier integrationURl
				const supplier = await Supplier.findOne({
					email: selectedProduct.supplierEmail,
				}).exec();
				const updateStockUrl =
					`${supplier.integrationURL}/${selectedProduct.productId}`.replace(
						/[\u200B-\u200D\uFEFF]/g,
						''
					);

				// Retain stock
				await axios.put(
					// 'http://suppliers-products-mock-api-rest:3005/supplier/1/product/637937926c6157f5991e4310',
					updateStockUrl,
					{},
					{ params: { stock: selectedProduct.quantity } }
				);

				updateAllProductsCache();

				// Get transaction and update status and product info.
				let updatedTransaction = await Transaction.findOneAndUpdate(
					req.transaction._id,
					{
						status: 'Pendiente de pago',
						productId: selectedProduct.productId,
						supplierEmail: selectedProduct.supplierEmail,
						productQuantity: selectedProduct.quantity,
					}
				);
				res.status(200).send(updatedTransaction);
			} catch (error) {
				console.log(error);
				res.status(400).send(error.message);
			}
		}
	});
});

router.get('/eventsProducts/:eventId', async (req, res) => {
	try {
		const eventId = req.params.eventId;

		const eventProducts = await getProductsByEvent(eventId, "Uruguay");
		res.status(200).send(eventProducts);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

router.post('/validationsTest', (req, res) => {
	pipeline.execute(req.body, function (err, result) {
		if (err) {
			console.log(err.message);
			res.status(400).send(err.message);
		} else {
			res.status(200).send('Validado con exito');
		}
	});
});

router.get('/transaction/:id', async (req, res) => {});

module.exports = router;
