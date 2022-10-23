const mongoose = require('mongoose');

// TODO agregar campo creador, que permita chequear diferencia entre aprobador y creador

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true
    }
});

mongoose.model('Event', eventSchema);