const jwt = require('jsonwebtoken');
const fs = require('fs');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// clase custom para try/catch.
class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

// Ver de tener algo generico y utilizar todos eso, no podemos tener uno por api.
const verifyAdminToken = async (req, res, next) => {
	const token = req.headers['authorization'];

	if (!token) {
		next(new RestError('A token is required for authentication', 401));
	}
	const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');
	await jwt.verify(token, PUBLIC_KEY, { algorithm: 'RS256' }, async function (err, user) {
		if (err) {
			next(new RestError(err.message, 403));
		} else {
			req.user = user;
			email = user.email;
			const newUser = await User.findOne({ email });
			if ('admin' != newUser.role) {
				return res.status(401).send('Usuario Invalido');
			}
			next();
		}
	});
};

module.exports = verifyAdminToken;
