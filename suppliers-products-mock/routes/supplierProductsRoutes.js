const express = require('express');
const mongoose = require('mongoose');

const SupplierProducts = [
	(SupplierProduct = mongoose.model('SupplierProduct')),
	(SupplierProduct2 = mongoose.model('SupplierProduct2')),
	(SupplierProduct3 = mongoose.model('SupplierProduct3')),
	(SupplierProduct4 = mongoose.model('SupplierProduct4')),
	(SupplierProduct5 = mongoose.model('SupplierProduct5')),
	(SupplierProduct6 = mongoose.model('SupplierProduct6')),
	(SupplierProduct7 = mongoose.model('SupplierProduct7')),
	(SupplierProduct8 = mongoose.model('SupplierProduct8')),
	(SupplierProduct9 = mongoose.model('SupplierProduct9')),
	(SupplierProduct10 = mongoose.model('SupplierProduct10')),
];

const router = express.Router();

router.post('/supplier/:id/products', async (req, res) => {
	try {
		const id = req.params.id - 1;
		const products = req.body;

		for (product of products) {
			const mongooseProduct = new SupplierProducts[id](
				({
					name,
					description,
					cost,
					informationUrl,
					eventId,
					validityDate,
					stock,
					supplierEmail,
					country,
				} = product)
			);

			await mongooseProduct.save();
		}
		res.status(200).send('Products created');
	} catch (err) {
		return res.status(500).send({
			status: 'Error',
			error: err.message,
		});
	}
});

router.get('/supplier/:id/products', async (req, res) => {
	try {
		const id = req.params.id - 1;
		let products = await SupplierProducts[id].find().lean();
		res.status(200).send(products);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

router.put('/supplier/:id/product/:productId', async (req, res) => {
	try {
		const id = req.params.id - 1;
		const productId = req.params.productId;
        console.log(productId)
		let productToUpdate = await SupplierProducts[id].findById(productId).lean();
		const newStock = productToUpdate.stock - req.query.stock;
		console.log(productToUpdate);
		productToUpdate.stock = newStock;

		let updatedProduct = await SupplierProducts[id].findOneAndUpdate(
			productId,
			productToUpdate
		);
		res.status(200).send(productToUpdate);
	} catch (error) {
		return res.status(500).send({ error: error.message });
	}
});

module.exports = router;
