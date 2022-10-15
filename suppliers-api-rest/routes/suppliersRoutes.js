const express = require('express');
const mongoose = require('mongoose');
const Supplier = mongoose.model('Supplier');
const { generateKeyPair } = require('crypto');
const axios = require('axios');

var constants = require('../models/Constants');

const router = express.Router();

router.post('/supplier', async (req, res) => {
	try {
		let supplierPrivateKey = '';
		let supplierPublicKey = '';
		generateKeyPair(
			'ec',
			{
				namedCurve: 'secp256k1', // Options
				publicKeyEncoding: {
					type: 'spki',
					format: 'der',
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'der',
				},
			},
			(err, publicKey, privateKey) => {
				if (!err) {
					supplierPrivateKey = privateKey.toString('hex');
					supplierPublicKey = publicKey.toString('hex');
				} else {
					console.log('Errr is: ', err);
				}
			}
		);
		const supplier = new Supplier(
			({ name, addres, email, phone, integrationURL } = req.body)
		);

		supplier.privateKey = supplierPrivateKey;

		await supplier.save();
		res.status(200).send({ publicKey: supplierPublicKey });
	} catch (err) {
		return res.status(422).send({
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
				console.error(error);
			});
	} catch (err) {
		return res.status(422).send({
			status: constants.RESPONSE_STATUS_ERROR,
			error: err.message,
		});
	}
});

module.exports = router;
