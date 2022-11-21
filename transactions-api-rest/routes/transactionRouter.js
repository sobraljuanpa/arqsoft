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
	getProductsByEvent,
	getProductStock,
} = require('../services/productsService');

// Move this to another file.
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

const validate_stock = async function (input, next) {
	//hay que validar stock, mismo formato que las anteriores
	const quantity = input.product.quantity;
	const productId = input.product.productId;
	const supplierEmail = input.product.supplierEmail;
	console.log('Quantity', quantity);
	const productStock = await getProductStock(supplierEmail, productId);
	if (quantity <= productStock) {
		next(null, input);
	} else {
		return next(Error('No hay stock suficiente para realizar la compra.'));
	}
};

pipeline.use(validate_mail);
pipeline.use(validate_CI);
pipeline.use(validate_stock);

const sessionQueue = expressQueue({ activeLimit: 1, queuedLimit: 100000 });

router.post('/transaction', async (req, res) => {
	try {
		const { name, birthdate, country } = req.body;

		// Validate user input
		if (!(name && birthdate && country)) {
			res.status(400).send('Campos incompletos');
		}

		const transaction = await Transaction.create({
			name,
			birthdate,
			country,
			status: 'En proceso',
			startDate: new Date().toUTCString(),
		});
		const PRIVATE_KEY = fs.readFileSync('./keys/private.key', 'utf8');
		const token = jwt.sign(JSON.stringify(transaction), PRIVATE_KEY, {
			algorithm: 'RS256',
		});
		const response = { sessionToken: token };
		res.status(201).json(response);
	} catch (err) {
		console.log(err);
	}
});

router.get('/eventsProducts/:eventId', sessionValidator, async (req, res) => {
	try {
		const eventId = req.params.eventId;
		const country = req.transaction.country;

		const eventProducts = await getProductsByEvent(eventId, country);
		res.status(200).send(eventProducts);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

router.post('/purchase', sessionValidator, sessionQueue, async (req, res) => {
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
				// TODO: Move this to product service
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

				// TODO: Chequear que este retornando el objeto actualizado.
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

router.post('/payment', sessionValidator, sessionQueue, async (req, res) => {
	const { fullName, cardNumber, birthDate, billingAddress } = req.body;

	if (fullName && cardNumber && birthDate && billingAddress) {
		// TODO: Chequear que este retornando el objeto actualizado.
		// Get transaction and update status and product info.
		let updatedTransaction = await Transaction.findOneAndUpdate(
			req.transaction._id,
			{
				status: 'Completada',
				paymentInfo: {
					fullName: fullName,
					cardNumber: cardNumber, // TODO: Encrypt this.
					birthDate: birthDate,
					billingAddress: billingAddress,
				},
			}
		);
		res.status(200).send(updatedTransaction);
	}
});

module.exports = router;
