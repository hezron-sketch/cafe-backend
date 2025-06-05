const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    
    const result = await authService.registerUser({
      email,
      password,
      name,
      phone
    });
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    
    const result = await authService.loginUser(idToken);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};