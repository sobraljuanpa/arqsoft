const express = require('express');
const mongoose = require('mongoose');
const Transaction = mongoose.model('Transaction');
var expressQueue = require('express-queue');
const fs = require('fs');
const router = express.Router();
var jwt = require('jsonwebtoken');
const sessionValidator = require('../middleware/sessionValidator');
const validationPipeline = require('../middleware/purchaseValidationPipeline');
const {
	paymentValidation,
	transactionValidation,
} = require('../middleware/paramsValidator');

const {
	getProductsByEvent,
	updateProductStock,
} = require('../services/productsService');

const sessionQueue = expressQueue({ activeLimit: 1, queuedLimit: 100000 });

router.post('/transaction', transactionValidation, async (req, res) => {
	try {
		const { name, birthdate, country } = req.body;

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

router.post(
	'/purchase',
	sessionValidator,
	sessionQueue,
	async (req, res) => {
		validationPipeline.execute(req.body, async function (err, result) {
			if (err) {
				res.status(400).send({ status: 400, message: err.message });
			} else {
				try {
					const selectedProduct = req.body.product;

					await updateProductStock(
						selectedProduct.productId,
						selectedProduct.supplierEmail,
						selectedProduct.quantity
					);

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
					res.status(400).send({ status: 400, message: err.message });
				}
			}
		});
	}
);

router.post(
	'/payment',
	sessionValidator,
	sessionQueue,
	paymentValidation,
	async (req, res) => {
		try {
			const { fullName, cardNumber, birthDate, billingAddress } = req.body;

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
		} catch (error) {
			await updateProductStock(
				req.transaction.productId,
				req.transaction.supplierEmail,
				-req.transaction.productQuantity
			);
			res.status(400).send({ status: 400, message: err.message });
		}
	}
);

module.exports = router;
