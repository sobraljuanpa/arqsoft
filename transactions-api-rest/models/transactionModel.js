const mongoose = require('mongoose');
const PaymentInfo = require('./PaymentInfo');

const transactionSchema = new mongoose.Schema({
	startDate: {
		type: String,
		required: false,
	},
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
	},
	paymentInfo: {
		type: PaymentInfo,
		required: false,
	},
});

mongoose.model('Transaction', transactionSchema);
