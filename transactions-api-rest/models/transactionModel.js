const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	birthdate: {
		type: String,
		required: true,
	},
	country: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		required: true,
	},
	productId: {
		type: String,
		required: false,
	},
	supplierEmail: {
		type: String,
		required: false,
	},
	productQuantity: {
		type: Number,
		required: false,
	}
});

mongoose.model('Transaction', transactionSchema);
