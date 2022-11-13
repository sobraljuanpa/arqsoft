const mongoose = require('mongoose');

const eventPublishingLogSchema = new mongoose.Schema({
	eventId: {
		type: String,
		required: true,
	},
	publisher: {
		type: String,
		required: true,
	},
	timestamp: {
		type: Date,
		required: true,
	},
});

mongoose.model('EventPublishingLog', eventPublishingLogSchema);
