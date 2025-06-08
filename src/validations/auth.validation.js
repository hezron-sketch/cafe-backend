// const { body } = require('express-validator');

// /**
//  * Validation rules for authentication endpoints
//  */
// const loginSchema = [
//   body('idToken')
//     .notEmpty().withMessage('ID token is required')
//     .isString().withMessage('ID token must be a string')
//     .isJWT().withMessage('ID token must be a valid JWT')
//     .trim()
// ];

// const registerSchema = [
//   body('email')
//     .notEmpty().withMessage('Email is required')
//     .isEmail().withMessage('Must be a valid email')
//     .normalizeEmail(),
//   body('password')
//     .notEmpty().withMessage('Password is required')
//     .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
//   body('name')
//     .notEmpty().withMessage('Name is required')
//     .isString().withMessage('Name must be a string')
//     .trim(),
//   body('phone')
//     .optional()
//     .isMobilePhone().withMessage('Must be a valid phone number')
// ];

// module.exports = {
//   loginSchema,
//   registerSchema
// };