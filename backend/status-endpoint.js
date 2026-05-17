// Endpoint de status simple para agregar al servidor
const fs = require('fs');

const statusEndpoint = async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      system: {
        name: "Boston Tracker",
        version: "1.0.0",
        environment: process.env.NODE_ENV || 'production',
        uptime: Math.round(process.uptime()) + ' segundos',
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
      },
      services: {}
    };

    // Database
    try {
      await sequelize.authenticate();
      status.services.database = {
        status: 'operational',
        name: 'PostgreSQL',
        details: 'Conectado exitosamente'
      };
    } catch (error) {
      status.services.database = {
        status: 'degraded',
        name: 'PostgreSQL',
        error: error.message
      };
    }

    // Deliveries
    try {
      const activeDeliveries = await Trip.count({ where: { status: 'active' } });
      const totalUsers = await User.count({ where: { role: 'delivery' } });
      status.services.deliveries = {
        status: 'operational',
        name: 'Deliveries',
        active_count: activeDeliveries,
        total_deliveries: totalUsers,
        details: `${activeDeliveries} activas de ${totalUsers} repartidores`
      };
    } catch (error) {
      status.services.deliveries = {
        status: 'degraded',
        name: 'Deliveries',
        error: error.message
      };
    }

    // API & WebSocket
    status.services.api = {
      status: 'operational',
      name: 'REST API',
      port: process.env.SERVER_PORT || 5000,
      details: 'API funcionando'
    };

    status.services.websocket = {
      status: 'operational', 
      name: 'Socket.io',
      connected_clients: io.sockets.sockets.size,
      details: `${io.sockets.sockets.size} clientes conectados`
    };

    // Frontend
    status.services.frontend = {
      status: 'operational',
      name: 'Dashboard Web',
      url: `http://${process.env.SERVER_IP}`,
      details: 'Dashboard accesible'
    };

    // Mobile APK
    try {
      const stats = fs.statSync('/var/www/html/apk/boston-tracker-latest.apk');
      status.services.mobile_app = {
        status: 'operational',
        name: 'App Móvil',
        apk_size: Math.round(stats.size / 1024 / 1024 * 100) / 100 + ' MB',
        details: 'APK disponible'
      };
    } catch (error) {
      status.services.mobile_app = {
        status: 'degraded',
        name: 'App Móvil',
        details: 'APK no encontrado'
      };
    }

    // Overall status
    const services = Object.values(status.services);
    const operational = services.filter(s => s.status === 'operational').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    
    if (degraded === 0) {
      status.overall_status = 'operational';
    } else {
      status.overall_status = 'partial_outage';
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      overall_status: 'major_outage',
      error: error.message
    });
  }
};

module.exports = statusEndpoint;
