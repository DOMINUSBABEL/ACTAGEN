
import { performance } from 'perf_hooks';
import { pLimit } from '../utils/concurrency';

// Simulate a PDF page
class MockPage {
  index: number;
  constructor(index: number) {
    this.index = index;
  }

  async getTextContent() {
    // Simulate async work and memory allocation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10)); // 10-60ms delay

    // Return a large structure to simulate text content memory usage
    const items = Array.from({ length: 1000 }, () => ({
      str: 'A'.repeat(100) // 100KB per page approx
    }));
    return { items };
  }
}

// Simulate PDF document
class MockPDF {
  numPages: number;

  constructor(numPages: number) {
    this.numPages = numPages;
  }

  async getPage(i: number) {
    await new Promise(resolve => setTimeout(resolve, 5)); // Small overhead to get page
    return new MockPage(i);
  }
}

async function runUnbounded(pdf: MockPDF) {
  const start = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  const pagePromises = Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(async (i) => {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    return `\n[PÁGINA ${i}]\n${pageText}\n`;
  });

  await Promise.all(pagePromises);

  const end = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    time: end - start,
    memoryDiff: (endMemory - startMemory) / 1024 / 1024
  };
}

async function runBounded(pdf: MockPDF, concurrency: number) {
  const start = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  const limit = pLimit(concurrency);
  const pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);

  const pagePromises = pages.map((i) => limit(async () => {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    return `\n[PÁGINA ${i}]\n${pageText}\n`;
  }));

  await Promise.all(pagePromises);

  const end = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    time: end - start,
    memoryDiff: (endMemory - startMemory) / 1024 / 1024
  };
}

async function main() {
  const NUM_PAGES = 500; // Large enough to show difference
  const pdf = new MockPDF(NUM_PAGES); // Simulate PDF

  console.log(`Running benchmark with ${NUM_PAGES} pages...`);

  // Force garbage collection if available (requires node --expose-gc)
  if (global.gc) {
      global.gc();
  }

  console.log('--- Unbounded ---');
  try {
      const unbounded = await runUnbounded(pdf);
      console.log(`Time: ${unbounded.time.toFixed(2)}ms`);
      console.log(`Memory Diff: ${unbounded.memoryDiff.toFixed(2)} MB`);
  } catch (e) {
      console.error("Unbounded failed:", e);
  }

  if (global.gc) {
      global.gc();
  }

  console.log('--- Bounded (Concurrency 20) ---');
  try {
      const bounded = await runBounded(pdf, 20);
      console.log(`Time: ${bounded.time.toFixed(2)}ms`);
      console.log(`Memory Diff: ${bounded.memoryDiff.toFixed(2)} MB`);
  } catch (e) {
      console.error("Bounded failed:", e);
  }
}

main().catch(console.error);
