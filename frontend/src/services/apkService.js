import api from './api';

class APKService {
  // Obtener información del APK
  async getAPKInfo() {
    try {
      const response = await api.get('/apk/info');
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        console.error('Error en respuesta del servidor:', response.data);
        return { success: false, message: 'Error obteniendo información del APK' };
      }
    } catch (error) {
      console.error('Error en getAPKInfo:', error);
      
      if (error.response?.status === 401) {
        return { success: false, message: 'No autorizado. Inicia sesión nuevamente.' };
      } else if (error.response?.status === 403) {
        return { success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión con el servidor' 
      };
    }
  }

  // Generar enlace de WhatsApp para enviar APK
  async generateWhatsAppLink(data) {
    try {
      const { phoneNumber, deliveryName, customMessage } = data;
      
      if (!phoneNumber) {
        return { success: false, message: 'Número de teléfono es requerido' };
      }
      
      const response = await api.post('/apk/send-whatsapp', {
        phoneNumber,
        deliveryName,
        customMessage
      });
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        console.error('Error en respuesta del servidor:', response.data);
        return { success: false, message: 'Error generando enlace de WhatsApp' };
      }
    } catch (error) {
      console.error('Error en generateWhatsAppLink:', error);
      
      if (error.response?.status === 401) {
        return { success: false, message: 'No autorizado. Inicia sesión nuevamente.' };
      } else if (error.response?.status === 403) {
        return { success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' };
      } else if (error.response?.status === 400) {
        return { success: false, message: error.response.data?.message || 'Datos inválidos' };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión con el servidor' 
      };
    }
  }

  // Generar enlace directo de WhatsApp (sin backend)
  generateDirectWhatsAppLink(phoneNumber, deliveryName = '', customMessage = '') {
    try {
      if (!phoneNumber) {
        throw new Error('Número de teléfono es requerido');
      }
      
      // Limpiar número de teléfono
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      // URL del APK
      const apkUrl = 'http://185.144.157.163/apk/boston-tracker-latest.apk';
      
      // Mensaje predefinido
      const defaultMessage = `*BOSTON American Burgers - App Delivery*

Hola ${deliveryName}!

Te envio la aplicacion oficial de BOSTON Tracker para que puedas comenzar a trabajar como delivery.

*Descarga la app aqui:*
${apkUrl}

📋 *Instrucciones:*
1️⃣ Descarga el archivo APK
2️⃣ Permite instalación de "Fuentes desconocidas"
3️⃣ Instala la aplicación
4️⃣ Usa tus credenciales de empleado para login

🚀 *¡Listo para comenzar!*

*Cualquier duda, no dudes en contactarme.*

---
BOSTON American Burgers 🍔`;
      
      const finalMessage = customMessage.trim() || defaultMessage;
      
      // Generar URL de WhatsApp
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;
      
      return {
        success: true,
        data: {
          whatsappUrl,
          phoneNumber: cleanPhone,
          apkUrl,
          message: finalMessage
        }
      };
      
    } catch (error) {
      console.error('Error generando enlace directo:', error);
      return { success: false, message: error.message };
    }
  }
}

const apkService = new APKService();
export default apkService;
