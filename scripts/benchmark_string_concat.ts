
import { performance } from 'perf_hooks';

interface Part {
  text?: string;
  inlineData?: any;
}

const NUM_ITEMS = 100000;
const TEXT_LENGTH = 100;

function generateContents(numItems: number): Part[] {
  const contents: Part[] = [];
  for (let i = 0; i < numItems; i++) {
    if (Math.random() > 0.1) {
      contents.push({ text: `[ARCHIVO_TEST_${i}]. Some random text content here. \n` + 'A'.repeat(TEXT_LENGTH) });
    } else {
      contents.push({ inlineData: { mimeType: 'image/jpeg', data: 'base64data' } });
    }
  }
  return contents;
}

function runConcatenation(contents: Part[]) {
  const start = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  let allText = "";
  let hasBinary = false;

  for (const part of contents) {
    if (part.text) {
      let cleanText = part.text.replace(/^\[ARCHIVO.*?\]\n/, '');
      allText += cleanText + "\n";
    } else if (part.inlineData) {
      hasBinary = true;
    }
  }

  const end = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    time: end - start,
    memoryDiff: (endMemory - startMemory) / 1024 / 1024,
    resultLength: allText.length,
    hasBinary
  };
}

function runArrayJoin(contents: Part[]) {
  const start = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  let hasBinary = false;
  const textParts: string[] = [];

  for (const part of contents) {
    if (part.text) {
      let cleanText = part.text.replace(/^\[ARCHIVO.*?\]\n/, '');
      textParts.push(cleanText);
    } else if (part.inlineData) {
      hasBinary = true;
    }
  }
  const allText = textParts.length > 0 ? textParts.join("\n") + "\n" : "";

  const end = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    time: end - start,
    memoryDiff: (endMemory - startMemory) / 1024 / 1024,
    resultLength: allText.length,
    hasBinary
  };
}

function main() {
  console.log(`Generating ${NUM_ITEMS} items...`);
  const contents = generateContents(NUM_ITEMS);

  if (global.gc) {
    global.gc();
  }

  console.log('--- String Concatenation ---');
  const concatResult = runConcatenation(contents);
  console.log(`Time: ${concatResult.time.toFixed(2)}ms`);
  console.log(`Memory Diff: ${concatResult.memoryDiff.toFixed(2)} MB`);
  console.log(`Result Length: ${concatResult.resultLength}`);

  if (global.gc) {
    global.gc();
  }

  console.log('--- Array Join ---');
  const joinResult = runArrayJoin(contents);
  console.log(`Time: ${joinResult.time.toFixed(2)}ms`);
  console.log(`Memory Diff: ${joinResult.memoryDiff.toFixed(2)} MB`);
  console.log(`Result Length: ${joinResult.resultLength}`);

  // Verification
  if (concatResult.resultLength !== joinResult.resultLength) {
      console.warn(`WARNING: Result lengths differ! Concat: ${concatResult.resultLength}, Join: ${joinResult.resultLength}`);
      // The original code does `allText += cleanText + "\n";`
      // My join code does `textParts.push(cleanText);` and then `join("\n") + "\n"`.
      // Let's analyze the difference.
      // If we have ["a", "b"], concat: "a\n" + "b\n" = "a\nb\n"
      // Join: ["a", "b"].join("\n") = "a\nb". Adding "\n" -> "a\nb\n".
      // Correct.
  }
}

main();
