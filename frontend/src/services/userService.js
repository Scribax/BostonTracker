import api from './api';

class UserService {
  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      console.log('🔍 Obteniendo todos los usuarios...');
      const response = await api.get('auth/users');
      
      if (response.data.success) {
        console.log(`✅ ${response.data.count} usuarios obtenidos`);
        return {
          success: true,
          data: response.data.data,
          count: response.data.count
        };
      } else {
        throw new Error(response.data.message || 'Error obteniendo usuarios');
      }
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error de conexión'
      };
    }
  }

  // Crear nuevo usuario
  async createUser(userData) {
    try {
      console.log('➕ Creando nuevo usuario:', userData.name);
      const response = await api.post('auth/users', userData);
      
      if (response.data.success) {
        console.log('✅ Usuario creado exitosamente');
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Error creando usuario');
      }
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error de conexión'
      };
    }
  }

  // Actualizar usuario
  async updateUser(userId, userData) {
    try {
      console.log('✏️ Actualizando usuario:', userId);
      const response = await api.put(`/auth/users/${userId}`, userData);
      
      if (response.data.success) {
        console.log('✅ Usuario actualizado exitosamente');
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Error actualizando usuario');
      }
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error de conexión'
      };
    }
  }

  // Eliminar usuario
  async deleteUser(userId) {
    try {
      console.log('🗑️ Eliminando usuario:', userId);
      const response = await api.delete(`/auth/users/${userId}`);
      
      if (response.data.success) {
        console.log('✅ Usuario eliminado exitosamente');
        return {
          success: true,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Error eliminando usuario');
      }
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error de conexión'
      };
    }
  }

  // Formatear fecha de último login
  formatLastLogin(lastLogin) {
    if (!lastLogin) return 'Nunca';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `Hace ${diffMinutes} min`;
      }
      return `Hace ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  // Obtener badge para el estado del usuario
  getStatusBadge(user) {
    if (!user.isActive) {
      return {
        variant: 'danger',
        text: 'Inactivo',
        icon: 'bi-x-circle-fill'
      };
    }
    
    // Verificar si tiene un viaje activo
    // Esta información debería venir del endpoint de usuarios
    if (user.hasActiveTrip) {
      return {
        variant: 'success',
        text: 'En viaje',
        icon: 'bi-geo-alt-fill'
      };
    }
    
    return {
      variant: 'primary',
      text: 'Activo',
      icon: 'bi-check-circle-fill'
    };
  }

  // Obtener badge para el rol del usuario
  getRoleBadge(role) {
    switch (role) {
      case 'admin':
        return {
          variant: 'warning',
          text: 'Administrador',
          icon: 'bi-shield-check'
        };
      case 'delivery':
        return {
          variant: 'info',
          text: 'Delivery',
          icon: 'bi-bicycle'
        };
      default:
        return {
          variant: 'secondary',
          text: role,
          icon: 'bi-person'
        };
    }
  }

  // Validar datos de usuario
  validateUserData(userData, isEdit = false) {
    const errors = {};

    // Nombre es requerido
    if (!userData.name || userData.name.trim() === '') {
      errors.name = 'El nombre es requerido';
    }

    // Contraseña es requerida para nuevo usuario
    if (!isEdit && (!userData.password || userData.password.trim() === '')) {
      errors.password = 'La contraseña es requerida';
    }

    // Validación para deliveries
    if (userData.role === 'delivery' && (!userData.employeeId || userData.employeeId.trim() === '')) {
      errors.employeeId = 'El ID de empleado es requerido para deliveries';
    }

    // Validación para admins
    if (userData.role === 'admin' && (!userData.email || userData.email.trim() === '')) {
      errors.email = 'El email es requerido para administradores';
    }

    // Validar formato de email si se proporciona
    if (userData.email && userData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.email = 'El formato del email no es válido';
      }
    }

    // Validar teléfono si se proporciona
    if (userData.phone && userData.phone.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(userData.phone)) {
        errors.phone = 'El formato del teléfono no es válido';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

const userService = new UserService();
export default userService;
