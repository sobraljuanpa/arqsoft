const express = require('express');
const mongoose = require('mongoose');

const Event = mongoose.model('Event');
const router = express.Router();
const auth = require("./middleware/authorization");
var jwt = require('jsonwebtoken');
const User = mongoose.model('User');

class RestError extends Error{
    constructor(message, status){
        super(message)
        this.status = status;
    }
}

router.get('/events', auth, async (req, res) => {
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
    event.enabled = false;

    const createdEvent = await event.save();
    res.status(201).send(createdEvent);
});

router.get('/events/:id', auth, async (req, res) => {
    const id = req.params.id;
    const event = await Event.findById(id).lean();

    if (!event) {
        throw new RestError('Recurso no encontrado', 404);
    }

    res.status(200).send(event);
});

// Put para pre aprobacion (modifico varios campos de la entidad, no se permite modificar enabled)

router.put('/events/:id', auth, async (req, res) => {
    const id = req.params.id;
    let eventToUpdate = await Event.findById(id).lean();
    let event = getModifiedEventFields(req);
    
    if (!eventToUpdate.enabled){
        let updatedEvent = await Event.findOneAndUpdate(id, event, {
            new: true
        });
        res.status(200).send(updatedEvent);
    } else {
        res.status(400).send({ error: "Event is enabled, can only modify start/end date using patch." });
    }
});

function getModifiedEventFields(request) {
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

// Patch para aprobacion y post aprobacion (solo modifico enabled, enddate o startdate)
router.patch('/events/:id', auth, async (req, res) => {
    const id = req.params.id;
    let paramsToUpdate = {};
    // TODO validar que el usuario actualizador y el creador de la entidad no sean el mismo si se modifica el campo enabled

    if (req.body.enabled) {
        paramsToUpdate.enabled = req.body.enabled;
    } else if (req.body.startDate) {
        paramsToUpdate.startDate = req.body.startDate;
    } else if (req.body.endDate) {
        paramsToUpdate.endDate = req.body.endDate;
    }

    let updatedEvent = await Event.findOneAndUpdate(id, paramsToUpdate, {
        new: true
    });

    res.status(200).send(updatedEvent);
});

router.get("/test", auth, (req, res) => {
    res.status(200).send("Token valido");
  });

// Register
router.post("/register", async (req, res) => {
	// our register logic goes here...
	try {
		// Get user input
		const { first_name, last_name, email, password, role } = req.body;
	
		// Validate user input
		if (!(email && password && first_name && last_name && role)) {
			res.status(400).send("Campos incompletos");
		}
		// check if user already exist
		// Validate if user exist in our database
		const oldUser = await User.findOne({ email });
	
		if (oldUser) {
			return res.status(409).send("Este email ya esta siendo utilizado");
		}
	
		// Create user in our database
		const user = await User.create({
			first_name,
			last_name,
			email: email.toLowerCase(), // sanitize: convert email to lowercase
			password: password,
            role: role,
		});
		// Create token
         //TODO: Token key must be on .env
        TOKEN_KEY = '43dnjndiuwed';
		const token = jwt.sign(
			{ user_id: user._id, email },
			TOKEN_KEY,
			{
				expiresIn: "2h",
			}
		);
		// save user token
		user.token = token;
	
		// return new user
		res.status(201).json(user);
	} catch (err) {
		console.log(err);
	}
	// Our register logic ends here
	});
	
	// Login
	router.post("/login", async (req, res) => {
	
		// Our login logic starts here
		try {
			// Get user input
			const { email, password } = req.body;
	
			// Validate user input
			if (!(email && password)) {
				res.status(400).send("All input is required");
			}
			// Validate if user exist in our database
			const user = await User.findOne({ email });
            //TODO: Token key must be on .env
			if (user && password == user.password) {
				// Create token
                TOKEN_KEY = '43dnjndiuwed';
				const token = jwt.sign(
					{ user_id: user._id, email },
					TOKEN_KEY,
					{
						expiresIn: "2h",
					}
				);
	
				// save user token
				user.token = token;
	
				// user
				res.status(200).json(user);
			}
			res.status(400).send("Invalid Credentials");
		} catch (err) {
			console.log(err);
		}
		// Our register logic ends here
	});


module.exports = router;