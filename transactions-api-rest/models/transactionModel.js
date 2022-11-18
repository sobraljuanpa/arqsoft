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
});

mongoose.model('Transaction', transactionSchema);
