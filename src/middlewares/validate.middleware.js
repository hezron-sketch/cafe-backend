// const { validationResult } = require('express-validator');

// /**
//  * Express middleware that validates the request against the provided schema
//  * @param {Array} validations - Array of validation chains
//  * @returns {Function} Express middleware function
//  */
// const validate = (validations) => async (req, res, next) => {
//     // Run all validations
//     await Promise.all(validations.map(validation => validation.run(req)));

//     // Check for validation errors
//     const errors = validationResult(req);
//     if (errors.isEmpty()) {
//         return next();
//     }

//     // Format errors for consistent response
//     const formattedErrors = errors.array().map(err => ({
//         field: err.path,
//         message: err.msg,
//         location: err.location,
//         value: err.value
//     }));

//     return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: formattedErrors
//     });
// };

// module.exports = validate;