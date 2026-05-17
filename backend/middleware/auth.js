const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Proteger rutas - verificar token JWT
const protect = async (req, res, next) => {
  let token;

  // Verificar si el token existe en el header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (sin password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Token no válido, usuario no encontrado'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario desactivado'
        });
      }

      next();
    } catch (error) {
      console.error('Error en autenticación:', error);
      return res.status(401).json({
        success: false,
        message: 'Token no válido'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, token requerido'
    });
  }
};

// Autorizar roles específicos
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rol ${req.user.role} no autorizado para acceder a esta ruta`
      });
    }
    next();
  };
};

// Verificar que el usuario puede acceder solo a sus propios datos (deliverys)
const authorizeOwnership = async (req, res, next) => {
  try {
    // Si es admin, puede acceder a todo
    if (req.user.role === 'admin') {
      return next();
    }

    // Si es delivery, solo puede acceder a sus propios datos
    if (req.user.role === 'delivery') {
      const deliveryId = req.params.id;
      
      // Verificar que el deliveryId corresponde al usuario logueado
      if (deliveryId && deliveryId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a estos datos'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error en autorización de propiedad:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = { protect, authorize, authorizeOwnership };
