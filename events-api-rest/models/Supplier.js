const mongoose = require('mongoose');
const Address = require('./Address');

const supplierSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	address: {
		type: Address,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	phone: {
		type: String,
		required: true,
	},
	integrationURL: {
		type: String,
		required: true,
		unique: true,
	},
	privateKey: {
		type: String,
		required: false,
	},
});

mongoose.model('Supplier', supplierSchema);
