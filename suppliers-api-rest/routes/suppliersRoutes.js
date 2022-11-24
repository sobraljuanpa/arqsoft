const express = require('express');
const mongoose = require('mongoose');
const Supplier = mongoose.model('Supplier');
const generateKeys = require('../common/cryptographer');
const createValidation = require('../middleware/paramsValidator');

const router = express.Router();

router.post('/supplier', createValidation, async (req, res) => {
	try {
		const { publicKey, privateKey } = generateKeys();
		const supplier = new Supplier(
			({ name, address, email, phone, integrationURL } = req.body)
		);

		supplier.privateKey = privateKey;

		await supplier.save();
		res.status(200).send({ publicKey: publicKey });
	} catch (err) {
		return res.status(400).send({
			status: 400,
			error: err.message,
		});
	}
});

module.exports = router;
