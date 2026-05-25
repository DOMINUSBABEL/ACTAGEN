
import { geminiService } from './services/geminiService';

async function testAudit() {
  const text = `
    El presidente concedió la palabra a el concejal ISVIMED.
    El costo fue de $20.000 pesos.
    El video "Camino al barrio" fue presentado.
    Ellos viven caminando hacia aquí.
  `;

  console.log("Original text:", text);

  try {
    const result = await geminiService.auditTextWithTEI([{ text }]);
    console.log("\n--- Result ---\n");
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  }
}

testAudit();
