const express = require('express');

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  register
);

router.post(
  '/login',
  login
);

router.get(
  '/profile',
  getProfile
);

router.patch(
  '/profile',
  updateProfile
);

router.patch(
  '/password',
  changePassword
);

module.exports = router;
