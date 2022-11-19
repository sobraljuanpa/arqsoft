const jwt = require('jsonwebtoken');
const fs = require('fs');
const mongoose = require('mongoose');
const User = mongoose.model('User');

class RestError extends Error {
	constructor(message, status) {
		super(message);
		this.status = status;
	}
}

const verifyAdminToken = async (req, res, next) => {
	const token = req.headers['authorization'];

	if (!token) {
		next(new RestError('Se necesita un token para autenticacion', 401));
	}
	const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');
	await jwt.verify(
		token,
		PUBLIC_KEY,
		{ algorithm: 'RS256' },
		async function (err, user) {
			if (err) {
				next(new RestError(err.message, 403));
			} else {
				// hacer nullchecks, tire un token con un email sin usuario registrado y me tiro el servicio
				req.user = user;
				email = user.email;
				const newUser = await User.findOne({ email });
				if ('admin' != newUser.role) {
					return res.status(401).send('Usuario no tiene rol de administrador');
				}
				next();
			}
		}
	);
};

const verifyProviderToken = async (req, res, next) => {
	const token = req.headers['authorization'];

	if (!token) {
		next(new RestError('Se necesita un token para autenticacion', 401));
	}
	const PUBLIC_KEY = fs.readFileSync('./keys/public.key', 'utf8');
	await jwt.verify(
		token,
		PUBLIC_KEY,
		{ algorithm: 'RS256' },
		async function (err, user) {
			if (err) {
				next(new RestError(err.message, 403));
			} else {
				req.user = user;
				email = user.email;
				const newUser = await User.findOne({ email });
				if ('provider' != newUser.role) {
					return res.status(401).send('Usuario Invalido');
				}
				next();
			}
		}
	);
};

module.exports = { verifyAdminToken, verifyProviderToken };
