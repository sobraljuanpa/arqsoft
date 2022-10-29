const express = require('express');
const mongoose = require('mongoose');
const Supplier = mongoose.model('Supplier');
const generateKeys = require('../common/cryptographer');
const axios = require('axios');

var constants = require('../models/Constants');

const router = express.Router();

router.post('/supplier', async (req, res) => {
	try {
		const { publicKey, privateKey } = generateKeys();
		const supplier = new Supplier(
			({ name, addres, email, phone, integrationURL } = req.body)
		);

		supplier.privateKey = privateKey;

		await supplier.save();
		res.status(200).send({ publicKey: publicKey });
	} catch (err) {
		return res.status(500).send({
			status: constants.RESPONSE_STATUS_ERROR,
			error: err.message,
		});
	}
});

router.get('/supplier/products', async (req, res) => {
	try {
		const email = req.headers.email;
		const supplier = await Supplier.findOne({ email: email }).exec();
		const supplierUrl = `${supplier.integrationURL}/products`;
		axios
			.get(supplierUrl)
			.then(async (response) => {
				res.status(200).send({ products: response.data });
			})
			.catch((error) => {
				return res.status(500).send({
					status: constants.RESPONSE_STATUS_ERROR,
					error: error.message,
				});
			});
	} catch (err) {
		return res.status(500).send({
			status: constants.RESPONSE_STATUS_ERROR,
			error: err.message,
		});
	}
});

module.exports = router;
