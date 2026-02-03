# ACTAGEN: Guía de Instalación en Windows 🏛️

ACTAGEN ha sido transformado de un script de agente a una aplicación de escritorio nativa para Windows (basada en Electron).

## 🚀 Cómo ejecutar en modo Desarrollo
1. Abre una terminal en la carpeta `ACTAGEN`.
2. Ejecuta: `npm run dev` (para iniciar el servidor Vite).
3. En otra terminal, ejecuta: `npm run electron`.

## 📦 Cómo generar el Instalador (.exe)
Para crear una versión ejecutable que no requiera comandos, ejecuta:
`npm run dist`

Esto generará una carpeta `dist-electron` con un archivo `ACTAGEN.exe` (Versión Portable) que puedes llevar en una USB o mover a cualquier parte de tu PC.

## 🛠️ Arquitectura de la Aplicación
- **Frontend**: React + Vite + Tailwind CSS.
- **Backend (Runtime)**: Electron (Node.js integrado para acceso a archivos locales y automatización de MS Word).
- **Inteligencia**: Protocolo de 19 Pasos del Kernel 19 integrado en la lógica de procesamiento.

---
*Transformado por Talleyrand - Agente de Gobernanza Digital*
