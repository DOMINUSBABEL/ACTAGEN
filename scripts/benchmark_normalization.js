// scripts/benchmark_normalization.js

import { performance } from 'perf_hooks';

const OFFICIAL_NAMES = [
    "Sebastián López Valencia",
    "Santiago Perdomo Montoya",
    "Carlos Alberto Gutiérrez Bustamante",
    "Andrés Felipe Tobón Villada",
    "María Paulina Suárez Roldán",
    "Alejandro De Bedout Arango",
    "Juan Carlos de la Cuesta Galvis",
    "Santiago Narváez Lombana",
    "Damián Pérez Arroyave",
    "Janeth Hurtado Betancur",
    "Farley Jhaír Macías Betancur",
    "José Luis Marín Mora",
    "Alejandro Arias García",
    "Miguel Ángel Iguarán Osorio",
    "Juan Ramón Jiménez Lara",
    "Brisvani Alexis Arenas Suaza",
    "Leticia Orrego Pérez",
    "Andrés Felipe Rodríguez Puerta",
    "Luis Guillermo de Jesús Vélez Álvarez"
];

const PRE_NORMALIZED_NAMES = OFFICIAL_NAMES.map(n => ({
    original: n,
    normalized: n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}));

// Generate test data
const iterations = 10000;
const testStrings = [];
const namesCount = OFFICIAL_NAMES.length;

for (let i = 0; i < iterations; i++) {
    if (Math.random() > 0.5) {
        const name = OFFICIAL_NAMES[Math.floor(Math.random() * namesCount)];
        const variation = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        testStrings.push(`En uso de la palabra el concejal ${variation} quien manifiesta...`);
    } else {
        testStrings.push("Una línea de texto normal sin nombres propios importantes.");
    }
}

console.log(`Running benchmark with ${iterations} lines...`);

function baseline(lines) {
    const output = [];
    for (let line of lines) {
        let trimmed = line.trim();
        OFFICIAL_NAMES.forEach(n => {
            const normLine = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const normName = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            if (normLine.includes(normName)) {
                trimmed = trimmed.replace(new RegExp(normName, 'gi'), n);
            }
        });
        output.push(trimmed);
    }
    return output;
}

function optimized(lines) {
    const output = [];
    for (let line of lines) {
        let trimmed = line.trim();
        // Optimization: Normalize line once
        const normLine = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        // Optimization: Use pre-calculated normalized names
        PRE_NORMALIZED_NAMES.forEach(({ original, normalized }) => {
            if (normLine.includes(normalized)) {
                trimmed = trimmed.replace(new RegExp(normalized, 'gi'), original);
            }
        });
        output.push(trimmed);
    }
    return output;
}

// Verification
const sampleSize = 1000;
const baselineOutput = baseline(testStrings.slice(0, sampleSize));
const optimizedOutput = optimized(testStrings.slice(0, sampleSize));

let mismatch = false;
for(let i=0; i<baselineOutput.length; i++) {
    if (baselineOutput[i] !== optimizedOutput[i]) {
        console.error(`Mismatch at index ${i}:`);
        console.error(`Baseline: ${baselineOutput[i]}`);
        console.error(`Optimized: ${optimizedOutput[i]}`);
        mismatch = true;
        break;
    }
}

if (!mismatch) {
    console.log("Verification passed: Output is identical.");
} else {
    console.error("Verification FAILED.");
    process.exit(1);
}

// Benchmark
const startBase = performance.now();
baseline(testStrings);
const endBase = performance.now();
console.log(`Baseline time: ${(endBase - startBase).toFixed(2)}ms`);

const startOpt = performance.now();
optimized(testStrings);
const endOpt = performance.now();
console.log(`Optimized time: ${(endOpt - startOpt).toFixed(2)}ms`);

const speedup = (endBase - startBase) / (endOpt - startOpt);
console.log(`Speedup: ${speedup.toFixed(2)}x`);
