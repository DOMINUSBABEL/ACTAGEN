# ACTAGEN: PROYECTO ENCUESTAS & BROADCAST (ACTA-POLL)

## Objetivo
Desarrollar un módulo de contacto masivo vía WhatsApp que permita procesar bases de datos para publicidad o encuestas (KPI: 1000-3000 mensajes) sin depender de cuotas de API pagas, utilizando la potencia de procesamiento local del nodo y la vinculación de cuentas (SIM cards).

## Arquitectura (Draft)
1. **Input**: Carga de bases de datos (Excel/CSV/JSON) con números telefónicos.
2. **Template Engine**: Personalización de mensajes dinámicos basados en la base de datos.
3. **Queue Manager**: Gestión de envíos con delay inteligente para evitar bloqueos de cuenta (antispam-logic).
4. **Execution Engine**: Uso del canal de WhatsApp vinculado en Clawdbot para el envío directo (`message.action=send`).
5. **Tracker**: Registro de respuestas y estados de entrega para cálculo de KPI.

## Relación con el Profe Paloma
- Este desarrollo sustenta la propuesta estratégica presentada al Profe Paloma sobre el uso de agentes para el "barrido" de opinión y movilización digital.

## Estimación de Costos
- Desarrollo base: $26 USD (Ejecutado).
- Infraestructura: SIM cards físicas + Cómputo local (Cero costo API).
