const express = require('express');
const mongoose = require('mongoose');
const Event = mongoose.model('Event');
const router = express.Router();
const auth = require("./middleware/authorization");

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

router.post('/events', auth, async (req, res) => {

    let event = new Event(
        ({ name, description, startDate, endDate, country, city } = req.body)
    );
    event.creator = req.user.email;
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

    res.status(200).send(event);
});

function validPUTRequestBody(request) {
    if (request.body.name || request.body.description || request.body.country || request.body.city) return false;
    return true;
};

function getDisabledModifiedEventFields(request) {
    let params = {};
    if (request.body.name) {
        params.name = request.body.name; 
    }
    if (request.body.description) {
        params.description = request.body.description;
    }
    if (request.body.startDate) {
        params.startDate = request.body.startDate;
    }
    if (request.body.endDate) {
        params.endDate = request.body.endDate;
    }
    if (request.body.country) {
        params.country = request.body.country;
    }
    if (request.body.city) {
        params.city = request.body.city;
    }
    return params;
};

function getEnabledModifiedEventFields(request) {
    let params = {};
    if (request.body.startDate) {
        params.startDate = request.body.startDate;
    }
    if (request.body.endDate) {
        params.endDate = request.body.endDate;
    }
    return params;
};

// Put para modificacion de todos los campos menos creator y enabled
router.put('/events/:id', auth, async (req, res) => {
    // tendria que tener un try catch y levantar un 500 en el catch nomas
    if (req.body.enabled) {
        res.status(400).send("Use PATCH for enabling events, PUT does not support that operation.");
    } else if (req.body.creator) {
        res.status(400).send("Cannot update event creator.");
    } else {
        const id = req.params.id;
        const event = await Event.findById(id).lean();
        console.log(id);
        console.log("Estoy en el else");
        console.log(event.enabled);
        console.log(event.enabled == true);
        if (event.enabled) {
            console.log("Entre al if event.enabled");
            console.log(validPUTRequestBody(req));
            if (validPUTRequestBody(req)) {
                let eventFields = getEnabledModifiedEventFields(req);
                let updatedEvent = await Event.findOneAndUpdate(id, eventFields, {
                    new: true
                });
                res.status(200).send(updatedEvent);
            } else {
                res.status(400).send("Event is enabled, can only update start or end date.")
            }
        } else {
            console.log("Entre al else event.enabled");
            let eventFields = getDisabledModifiedEventFields(req);
            let updatedEvent = await Event.findOneAndUpdate(id, eventFields, {
                new: true
            });
            res.status(200).send(updatedEvent);
        }
    }
});

async function approvingUserIsNotCreator(eventId, approver) {
    const eventToUpdate = await Event.findById(eventId).lean();
    const creator = eventToUpdate.creator;
    return creator != approver;
};

// Patch para aprobacion unicamente, facilita el tema de loggeo
router.patch('/events/:id', auth, async (req, res) => {
    const id = req.params.id;
    let paramsToUpdate = {};
    if (await approvingUserIsNotCreator(id, req.user.email)) {
        paramsToUpdate.enabled = req.body.enabled;
        let updatedEvent = await Event.findOneAndUpdate(id, paramsToUpdate, {
            new: true
        });
        res.status(200).send(updatedEvent);
    } else {
        res.status(400).send("Event can't be approved by same user that created it");
    }
});

module.exports = router;