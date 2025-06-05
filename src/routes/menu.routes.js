const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Public routes
router.get('/', menuController.getAllMenuItems);
router.get('/:id', menuController.getMenuItemById);

// Protected routes (admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin'),
  menuController.createMenuItem
);

router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  menuController.updateMenuItem
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('admin'),
  menuController.deleteMenuItem
);

module.exports = router;