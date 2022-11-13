const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const User = mongoose.model('User');


const verifyAdminToken = async (req, res, next) => {
  const token =
  req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, '43dnjndiuwed');
    req.user = decoded;
    email = decoded.email;
    const newUser = await User.findOne({ email });
    if ('admin' != newUser.role){
      return res.status(401).send("Usuario Invalido");
    }
  } catch (err) {
    return res.status(401).send("Token Invalido");
  }
  return next();
};

module.exports = verifyAdminToken;