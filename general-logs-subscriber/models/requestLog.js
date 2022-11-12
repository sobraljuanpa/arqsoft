const mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema({
    method: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    body: {
        type: Object,
        required: false
    },
    statusCode: {
        type: Number,
        required: true
    },
    timetaken: { //ms
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    }
});

mongoose.model('RequestLog', requestLogSchema);