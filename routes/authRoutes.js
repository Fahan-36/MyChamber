const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile, changePassword, deleteAccount, uploadProfileImage } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const profileUpload = require('../middleware/profileUpload');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['doctor', 'patient']).withMessage('Role must be either doctor or patient'),
  body('phone').optional(),
  body('bmdc_registration_number')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('BMDC Registration Number is required')
], register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authenticate, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional(),
  body('age').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Age must be a positive number'),
  body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other', '']).withMessage('Invalid gender value')
], updateProfile);

// @route   PUT /api/auth/profile-image
// @desc    Upload authenticated user profile image
// @access  Private
router.put('/profile-image', authenticate, profileUpload.single('image'), uploadProfileImage);

// @route   PUT /api/auth/change-password
// @desc    Change current user password
// @access  Private
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], changePassword);

// @route   DELETE /api/auth/delete-account
// @desc    Delete current authenticated account (patient or doctor)
// @access  Private
router.delete('/delete-account', authenticate, deleteAccount);

module.exports = router;
