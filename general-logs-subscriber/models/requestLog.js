const mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema({
	method: {
		type: String,
		required: true,
	},
	url: {
		type: String,
		required: true,
	},
	body: {
		type: Object,
		required: false,
	},
	statusCode: {
		type: Number,
		required: true,
	},
	actor: {
		type: String,
		required: false,
	},
	timetaken: {
		//ms
		type: Number,
		required: true,
	},
	inboundTimestamp: {
		type: Date,
		required: true,
	},
	outboundTimestamp: {
		type: Date,
		required: true,
	}
});

mongoose.model('RequestLog', requestLogSchema);
