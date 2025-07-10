const jwt = require('jsonwebtoken');

const generateToken = (uid) => {
  console.log('Generating token for user ID:', uid);
  const token = jwt.sign({ uid }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
  console.log('Generated token payload:', jwt.decode(token));
  return token;
};

module.exports = {
  generateToken
};