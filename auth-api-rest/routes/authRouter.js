const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const router = express.Router();
var jwt = require('jsonwebtoken');
const User = mongoose.model('User');

// este endpoint se usa para algo? lo queremos?
// si no se usa para nada puedo agregar el middleware de loggeo a todas las reqs de este endpoint nomas
router.post('/auth', async (req, res) => {
	const token = req.headers['authorization'];

	if (!token) {
		return res.status(403).send('A token is required for authentication');
	}
	try {
		const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');
		jwt.verify(
			token,
			PUBLIC_KEY,
			{ algorithm: 'RS256' },
			async function (err, user) {
				if (err) {
					return res.status(403).send(err.message);
				} else {
					req.user = user;
					email = user.email;
					const newUser = await User.findOne({ email });
					if ('admin' != newUser.role) {
						return res.status(401).send('Usuario Invalido');
					}
					res.status(200).json(newUser.role);
				}
			}
		);
	} catch (err) {
		return res.status(401).send('Token Invalido');
	}
});

router.post('/register', async (req, res) => {
	// our register logic goes here...
	try {
		// Get user input
		const { first_name, last_name, email, password, role } = req.body;

		// Validate user input
		if (!(email && password && first_name && last_name && role)) {
			res.status(400).send('Campos incompletos');
		}
		// check if user already exist
		// Validate if user exist in our database
		const oldUser = await User.findOne({ email });

		if (oldUser) {
			return res.status(409).send('Este email ya esta siendo utilizado');
		}

		// Create user in our database
		// TODO: Encrypt password
		const user = await User.create({
			first_name,
			last_name,
			email: email.toLowerCase(), // sanitize: convert email to lowercase
			password: password,
			role: role,
		});
		// TODO: Evaluar si esto es necesario, me parece que no. Que haga login siempre.
		const PRIVATE_KEY = fs.readFileSync('./keys/private.key', 'utf8');
		const token = jwt.sign(JSON.stringify(user), PRIVATE_KEY, {
			algorithm: 'RS256',
		});
		// save user token
		user.token = token;

		res.status(201).json(user);
	} catch (err) {
		console.log(err);
	}
});

router.post('/login', async (req, res) => {
	// Our login logic starts here
	try {
		// Get user input
		const { email, password } = req.body;

		// Validate user input
		if (!(email && password)) {
			res.status(400).send('All input is required');
		}
		// Validate if user exist in our database
		const user = await User.findOne({ email });

		if (user && password == user.password) {
			const PRIVATE_KEY = fs.readFileSync('./keys/private.key', 'utf8');
			// If we want to add more information to the token we have to change the first parameter.
			// Investigate to add lifetime.
			const token = jwt.sign(JSON.stringify(user), PRIVATE_KEY, {
				algorithm: 'RS256',
			});

			// Save user token
			user.token = token;
			res.status(200).json(user);
		}
		res.status(400).send('Invalid Credentials');
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
