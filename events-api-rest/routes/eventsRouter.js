const express = require('express');
const mongoose = require('mongoose');

const Event = mongoose.model('Event');
const router = express.Router();

class RestError extends Error{
    constructor(message, status){
        super(message)
        this.status = status;
    }
}

router.get('/events', async (req, res) => {
    try {
        let events = await Event.find().lean();
        res.status(200).send(events);
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

router.post('/events', async (req, res) => {

    let event = new Event(
        ({ name, description, startDate, endDate, country, city } = req.body)
    );
    event.enabled = false;

    const createdEvent = await event.save();
    res.status(201).send(createdEvent);
});

router.get('/events/:id', async (req, res) => {
    const id = req.params.id;
    const event = await Event.findById(id).lean();

    if (!event) {
        throw new RestError('Recurso no encontrado', 404);
    }
    res.send(event);
});

module.exports = router;