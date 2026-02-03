const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuración de rutas
const INBOUND_DIR = path.join(__dirname, 'inbound');
const OUTBOUND_DIR = path.join(__dirname, 'outbound');

/**
 * Módulo de Interoperabilidad Talleyrand <-> ACTAGEN App
 * Este script actúa como el puente de exportación.
 */

function exportToApp(fileName, content) {
    console.log(`[EXPORT] Iniciando exportación de ${fileName} hacia la App ACTAGEN...`);
    
    // 1. Asegurar directorios
    if (!fs.existsSync(INBOUND_DIR)) fs.mkdirSync(INBOUND_DIR, { recursive: true });
    
    const targetPath = path.join(INBOUND_DIR, `${fileName}.md`);
    
    // 2. Escribir el contenido para que la App lo detecte
    fs.writeFileSync(targetPath, content, 'utf-8');
    
    console.log(`[SUCCESS] Archivo disponible en la bandeja de entrada de la aplicación.`);
    
    // 3. Notificación de disponibilidad (Placeholder para comunicación entre procesos)
    const metadata = {
        source: "Talleyrand-Core",
        timestamp: new Date().toISOString(),
        file: fileName,
        status: "ready_for_manual_curation"
    };
    fs.writeFileSync(path.join(INBOUND_DIR, `${fileName}.json`), JSON.stringify(metadata, null, 2));
}

// Ejemplo de uso para el Agente:
// exportToApp('acta_348_borrador', content);
