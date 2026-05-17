const express = require('express');
const { 
  loginUser, 
  getCurrentUser, 
  logoutUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/me
// @desc    Obtener usuario actual
// @access  Private
router.get('/me', protect, getCurrentUser);

// @route   POST /api/auth/logout
// @desc    Cerrar sesión
// @access  Private
router.post('/logout', protect, logoutUser);

// ============= RUTAS DE GESTIÓN DE USUARIOS (ADMIN ONLY) =============

// @route   GET /api/auth/users
// @desc    Obtener todos los usuarios (solo admin)
// @access  Private (Admin)
router.get('/users', protect, getAllUsers);

// @route   POST /api/auth/users
// @desc    Crear nuevo usuario (solo admin)
// @access  Private (Admin)
router.post('/users', protect, createUser);

// @route   PUT /api/auth/users/:id
// @desc    Actualizar usuario (solo admin)
// @access  Private (Admin)
router.put('/users/:id', protect, updateUser);

// @route   DELETE /api/auth/users/:id
// @desc    Eliminar usuario (solo admin)
// @access  Private (Admin)
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
