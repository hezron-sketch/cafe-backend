const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');

// Public routes
router.get('/', menuController.getAllMenuItems);
router.get('/categories', menuController.getCategories);
router.get('/:id', menuController.getMenuItemById);

router.post(
  '/',
  authMiddleware.authenticate, // <-- use the function
  isAdmin,
  menuController.createMenuItem
);
router.patch(
  '/:id',
  authMiddleware.authenticate,
  isAdmin,
  menuController.updateMenuItem
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  isAdmin,
  menuController.deleteMenuItem
);

module.exports = router;