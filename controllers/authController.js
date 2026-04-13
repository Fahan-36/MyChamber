const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role, phone, age, gender, specialization, qualification, bmdc_registration_number, consultation_fee, chamber_address } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone
    });

    // Create role-specific profile
    if (role === 'doctor') {
      if (!specialization || !qualification || !bmdc_registration_number || !consultation_fee || !chamber_address) {
        return res.status(400).json({
          success: false,
          message: 'Doctor registration requires specialization, qualification, bmdc_registration_number, consultation_fee, and chamber_address'
        });
      }
      
      await Doctor.create({
        user_id: userId,
        specialization,
        qualification,
        bmdc_registration_number,
        consultation_fee,
        chamber_address
      });
    } else if (role === 'patient') {
      await Patient.create({
        user_id: userId,
        age: age || null,
        gender: gender || null
      });
    }

    // Get created user
    const user = await User.findById(userId);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profile_image: user.profile_image || null
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profile_image: user.profile_image || null
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Upload authenticated user profile image
// @route   PUT /api/auth/profile-image
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile image file is required'
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const nextImagePath = `/uploads/profile-images/${req.file.filename}`;

    try {
      await User.updateProfileImage(userId, nextImagePath);
    } catch (error) {
      if (error.code === 'ER_PROFILE_IMAGE_MIGRATION_REQUIRED') {
        return res.status(500).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }

    if (user.profile_image && user.profile_image !== nextImagePath && user.profile_image.startsWith('/uploads/profile-images/')) {
      const previousImageRelativePath = user.profile_image.replace(/^\/+/, '');
      const previousImagePath = path.join(__dirname, '..', previousImageRelativePath);
      fs.unlink(previousImagePath, () => {
        // Best-effort cleanup: failures here should not fail the request.
      });
    }

    const updatedUser = await User.findById(userId);
    let profileData = { ...updatedUser };

    if (updatedUser.role === 'doctor') {
      const doctorProfile = await Doctor.findByUserId(userId);
      profileData.doctorProfile = doctorProfile;
    } else if (updatedUser.role === 'patient') {
      const patientProfile = await Patient.findByUserId(userId);
      profileData.patientProfile = patientProfile;
    }

    return res.json({
      success: true,
      message: 'Profile image updated successfully',
      data: profileData
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error uploading profile image'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profileData = { ...user };

    // Get role-specific data
    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findByUserId(user.id);
      // Return doctor profile if exists (may be null for newly registered doctors)
      profileData.doctorProfile = doctorProfile || null;
    } else if (user.role === 'patient') {
      const patientProfile = await Patient.findByUserId(user.id);
      profileData.patientProfile = patientProfile || null;
    }

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user table (name, phone) while preserving existing values.
    const { name, phone, age, gender } = req.body;
    const nextName = name !== undefined ? String(name).trim() : user.name;
    const nextPhone = phone !== undefined ? phone : user.phone;
    await User.update(userId, { name: nextName, phone: nextPhone });

    // Update role-specific data
    if (user.role === 'patient') {
      const patientProfile = await Patient.findByUserId(userId);
      if (patientProfile) {
        const nextAge = age !== undefined ? age : patientProfile.age;
        const nextGender = gender !== undefined ? gender : patientProfile.gender;
        await Patient.update(patientProfile.patient_id, { age: nextAge, gender: nextGender });
      }
    }

    // Get updated profile
    const updatedUser = await User.findById(userId);
    let profileData = { ...updatedUser };

    if (user.role === 'patient') {
      const patientProfile = await Patient.findByUserId(userId);
      profileData.patientProfile = patientProfile;
    } else if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findByUserId(userId);
      profileData.doctorProfile = doctorProfile;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// @desc    Change authenticated user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByIdWithPassword(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.updatePassword(req.user.id, hashedPassword);

    return res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// @desc    Delete authenticated account safely (patient or doctor)
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  let connection;

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Delete based on role
    if (user.role === 'patient') {
      const [patientRows] = await connection.query(
        'SELECT patient_id FROM patients WHERE user_id = ? FOR UPDATE',
        [userId]
      );

      if (!patientRows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const patientId = patientRows[0].patient_id;

      // Delete only this patient's own notifications.
      await connection.query('DELETE FROM notifications WHERE user_id = ?', [userId]);

      // Delete only this patient's own appointments (never by doctor_id).
      await connection.query('DELETE FROM appointments WHERE patient_id = ?', [patientId]);

      // Delete only this patient's row.
      await connection.query('DELETE FROM patients WHERE patient_id = ? AND user_id = ?', [patientId, userId]);
    } else if (user.role === 'doctor') {
      const [doctorRows] = await connection.query(
        'SELECT doctor_id FROM doctors WHERE user_id = ? FOR UPDATE',
        [userId]
      );

      if (!doctorRows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const doctorId = doctorRows[0].doctor_id;

      // Delete only this doctor's own notifications.
      await connection.query('DELETE FROM notifications WHERE user_id = ?', [userId]);

      // Delete only this doctor's appointments and cascade-related records.
      // appointment_reports will cascade delete via foreign key
      await connection.query('DELETE FROM appointments WHERE doctor_id = ?', [doctorId]);

      // Delete only this doctor's schedule entries.
      await connection.query('DELETE FROM doctor_schedule WHERE doctor_id = ?', [doctorId]);

      // Delete only this doctor's row.
      await connection.query('DELETE FROM doctors WHERE doctor_id = ? AND user_id = ?', [doctorId, userId]);
    } else if (user.role === 'admin') {
      // Delete only this admin's own notifications.
      await connection.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    } else {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    // Delete only this user's row (final step for both roles).
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();

    return res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Delete account rollback error:', rollbackError);
      }
    }

    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting account'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  uploadProfileImage
};
