const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const fs = require('fs');
var jwt = require('jsonwebtoken');
const {
	registerValidation,
	loginValidation,
} = require('../middleware/paramsValidator');
const crypto = require('crypto');

const createToken = (user) => {
	user.password = null;
	const PRIVATE_KEY = fs.readFileSync('./keys/private.key', 'utf8');
	const token = jwt.sign(JSON.stringify(user), PRIVATE_KEY, {
		algorithm: 'RS256',
	});
	return token;
};

router.post('/register', registerValidation, async (req, res) => {
	try {
		const { first_name, last_name, email, password, role } = req.body;

		const hashedPassword = crypto
			.createHash('sha256')
			.update(password)
			.digest('base64');

		const user = await User.create({
			first_name,
			last_name,
			email: email.toLowerCase(), // sanitize: convert email to lowercase
			password: hashedPassword,
			role: role,
		});

		const token = createToken(user);
		user.token = token;

		res.status(200).json(user);
	} catch (err) {
		res.status(400).send({
			status: 400,
			message: err.message,
		});
	}
});

router.post('/login', loginValidation, async (req, res) => {
	try {
		const { email, password } = req.body;

		const hashedPassword = crypto
			.createHash('sha256')
			.update(password)
			.digest('base64');

		// Validate if user exist in our database
		const user = await User.findOne({ email });

		if (user && hashedPassword == user.password) {
			const token = createToken(user);
			user.token = token;

			res.status(200).json(user);
		} else {
			res.status(400).send('Credenciales inválidas.');
		}
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
