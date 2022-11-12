const express = require('express');
const mongoose = require('mongoose');
const config = require('config');
const router = express.Router();
var jwt = require('jsonwebtoken');
const User = mongoose.model('User');

router.post("/auth", async (req, res) => {
	const token =
	req.body.token || req.query.token || req.headers["x-access-token"];

	if (!token) {
		return res.status(403).send("A token is required for authentication");
	}
	try {
		const decoded = jwt.verify(token, config.get('jwt.accessTokenSecret'));
		req.user = decoded;
		email = decoded.email;
		const newUser = await User.findOne({ email });
		if ('admin' != newUser.role){
			return res.status(401).send("Usuario Invalido");
		}	
		res.status(200).json(newUser.role);
	} catch (err) {
		return res.status(401).send("Token Invalido");
	}
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
		const token = jwt.sign(
			{ user_id: user._id, email },
			config.get('jwt.accessTokenSecret'),
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
			const token = jwt.sign(
				{ user_id: user._id, email },
				config.get('jwt.accessTokenSecret'),
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