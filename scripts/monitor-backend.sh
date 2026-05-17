#!/bin/bash

# Script de monitoreo avanzado del backend Boston Tracker
# Detecta procesos colgados, suspendidos y problemas de API

LOG_FILE="/var/log/boston-tracker-monitor.log"
SERVICE_NAME="boston-tracker-backend.service"
API_URL="http://localhost:5000/api/health"
MAX_RESPONSE_TIME=10

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Función para reiniciar el servicio
restart_service() {
    log_message "ERROR: $1. Reiniciando servicio..."
    systemctl restart $SERVICE_NAME
    sleep 15
    
    # Verificar que se reinició correctamente
    if systemctl is-active --quiet $SERVICE_NAME; then
        log_message "SUCCESS: Servicio reiniciado correctamente"
    else
        log_message "CRITICAL: No se pudo reiniciar el servicio"
    fi
}

# 1. Verificar que el servicio systemd esté activo
if ! systemctl is-active --quiet $SERVICE_NAME; then
    restart_service "Servicio systemd no está activo"
    exit 1
fi

# 2. Verificar que el proceso exista
PID=$(systemctl show -p MainPID $SERVICE_NAME | cut -d= -f2)
if [ "$PID" = "0" ] || ! kill -0 $PID 2>/dev/null; then
    restart_service "Proceso principal no existe (PID: $PID)"
    exit 1
fi

# 3. Verificar que el puerto esté escuchando
if ! ss -tulpn | grep :5000 > /dev/null; then
    restart_service "Puerto 5000 no está escuchando"
    exit 1
fi

# 4. Verificar estado del proceso (detectar procesos suspendidos)
PROCESS_STATE=$(ps -o state= -p $PID 2>/dev/null | tr -d ' ')
if [ "$PROCESS_STATE" = "T" ]; then
    log_message "ERROR: Proceso suspendido detectado (SIGSTOP). Matando y reiniciando..."
    kill -9 $PID 2>/dev/null
    sleep 5
    restart_service "Proceso estaba suspendido"
    exit 1
fi

# 5. Verificar que la API responda en tiempo razonable
API_START_TIME=$(date +%s)
if ! timeout $MAX_RESPONSE_TIME curl -s $API_URL > /dev/null 2>&1; then
    API_END_TIME=$(date +%s)
    RESPONSE_TIME=$((API_END_TIME - API_START_TIME))
    
    if [ $RESPONSE_TIME -ge $MAX_RESPONSE_TIME ]; then
        restart_service "API no responde en $MAX_RESPONSE_TIME segundos (timeout)"
    else
        restart_service "API no accesible en $API_URL"
    fi
    exit 1
fi

# 6. Verificar contenido de la respuesta de la API
API_RESPONSE=$(curl -s --connect-timeout 5 $API_URL)
if ! echo "$API_RESPONSE" | grep -q '"status":"OK"'; then
    restart_service "API responde pero no devuelve status OK: $API_RESPONSE"
    exit 1
fi

# 7. Verificar uso de memoria (reiniciar si usa más de 200MB)
MEMORY_KB=$(ps -o rss= -p $PID 2>/dev/null | tr -d ' ')
MEMORY_MB=$((MEMORY_KB / 1024))
if [ $MEMORY_MB -gt 200 ]; then
    restart_service "Uso excesivo de memoria: ${MEMORY_MB}MB (máximo 200MB)"
    exit 1
fi

# Todo OK
log_message "INFO: Backend verificado - OK (PID: $PID, Estado: $PROCESS_STATE, Memoria: ${MEMORY_MB}MB)"
