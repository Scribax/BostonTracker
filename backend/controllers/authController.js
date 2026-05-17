const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, employeeId, password } = req.body;

    // Validar que se proporcionó email o employeeId
    if (!password || (!email && !employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona credenciales válidas'
      });
    }

    let user;
    
    // Buscar usuario por email (admin) o employeeId (delivery)
    if (email) {
      user = await User.findOne({ email, role: 'admin' });
    } else if (employeeId) {
      user = await User.findOne({ employeeId, role: 'delivery' });
    }

    // Verificar si el usuario existe y la contraseña es correcta
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generar token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener información del usuario actual
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Cerrar sesión
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // En JWT no necesitamos hacer nada en el servidor
    // El cliente debe eliminar el token
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ==================== FUNCIONES DE GESTIÓN DE USUARIOS ====================

// @desc    Obtener todos los usuarios (solo admin)
// @route   GET /api/auth/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }

    // Obtener todos los usuarios excepto la contraseña
    const users = await User.find({}, '-password').sort({ createdAt: -1 });

    // Obtener información de viajes activos
    const DeliveryTrip = require('../models/DeliveryTrip');
    const usersWithTripInfo = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        
        // Solo buscar viajes para usuarios con rol delivery
        if (user.role === 'delivery') {
          const activeTrip = await DeliveryTrip.findOne({
            userId: user._id,
            status: 'active'
          });
          
          userObj.hasActiveTrip = !!activeTrip;
          userObj.activeTripId = activeTrip?._id;
          userObj.tripStartTime = activeTrip?.startTime;
          userObj.currentMileage = activeTrip?.totalMileage || 0;
        } else {
          userObj.hasActiveTrip = false;
        }
        
        return userObj;
      })
    );

    res.json({
      success: true,
      data: usersWithTripInfo,
      count: usersWithTripInfo.length
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Crear nuevo usuario (solo admin)
// @route   POST /api/auth/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }

    const { name, email, employeeId, password, phone, role = 'delivery', isActive = true } = req.body;

    // Validación de campos requeridos
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y contraseña son requeridos'
      });
    }

    // Para deliveries, employeeId es requerido; para admins, email es requerido
    if (role === 'delivery' && !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'ID de empleado es requerido para deliveries'
      });
    }

    if (role === 'admin' && !email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido para administradores'
      });
    }

    // Verificar si el email ya existe (si se proporciona)
    if (email) {
      const existingUserByEmail = await User.findOne({ email });
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este email'
        });
      }
    }

    // Verificar si el employeeId ya existe (si se proporciona)
    if (employeeId) {
      const existingUserByEmployeeId = await User.findOne({ employeeId });
      if (existingUserByEmployeeId) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este ID de empleado'
        });
      }
    }

    // Crear nuevo usuario
    const user = await User.create({
      name,
      email: email || undefined,
      employeeId: employeeId || undefined,
      password,
      phone: phone || undefined,
      role,
      isActive
    });

    // Devolver usuario sin contraseña
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userResponse
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    
    // Manejar errores de validación de mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar usuario (solo admin)
// @route   PUT /api/auth/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }

    const userId = req.params.id;
    const { name, email, employeeId, password, phone, isActive } = req.body;

    // Buscar usuario a actualizar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Prevenir que el admin se desactive a sí mismo
    if (user._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    // Verificar unicidad de email (si se está cambiando)
    if (email && email !== user.email) {
      const existingUserByEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro usuario con este email'
        });
      }
    }

    // Verificar unicidad de employeeId (si se está cambiando)
    if (employeeId && employeeId !== user.employeeId) {
      const existingUserByEmployeeId = await User.findOne({ employeeId, _id: { $ne: userId } });
      if (existingUserByEmployeeId) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro usuario con este ID de empleado'
        });
      }
    }

    // Actualizar campos
    if (name) user.name = name;
    if (email !== undefined) user.email = email || undefined;
    if (employeeId !== undefined) user.employeeId = employeeId || undefined;
    if (phone !== undefined) user.phone = phone || undefined;
    if (isActive !== undefined) user.isActive = isActive;

    // Actualizar contraseña si se proporciona
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    // Devolver usuario actualizado sin contraseña
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: userResponse
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    
    // Manejar errores de validación de mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Eliminar usuario (solo admin)
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    // Verificar que el usuario es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }

    const userId = req.params.id;

    // Buscar usuario a eliminar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Prevenir que el admin se elimine a sí mismo
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    // TODO: Verificar si el usuario tiene viajes activos
    // En una versión más robusta, deberíamos verificar dependencias
    
    // Eliminar usuario
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: `Usuario ${user.name} eliminado exitosamente`
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  loginUser,
  getCurrentUser,
  logoutUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
