const mongoose = require('mongoose');

const eventUpdateLogSchema = new mongoose.Schema({
	eventId: {
		type: String,
		required: true,
	},
	body: {
		type: Object,
		required: false,
	},
	updater: {
		type: String,
		required: true,
	},
	timestamp: {
		type: Date,
		required: true,
	},
});

mongoose.model('EventUpdateLog', eventUpdateLogSchema);
