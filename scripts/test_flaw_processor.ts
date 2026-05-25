
import { processFlawTags } from '../services/teiFlawProcessor';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("Running TEI Flaw Processor Tests...");

  // Case 1: Simple flaw with suggestion
  {
    const input = 'El concejal <FLAW Type="estilo" Suggestion="Isvimed">ISVIMED</FLAW> habló.';
    const result = processFlawTags(input);
    assert(result.cleanText === 'El concejal Isvimed habló.', 'Case 1: Clean text mismatch');
    assert(result.flaws.length === 1, 'Case 1: Flaw count mismatch');
    assert(result.flaws[0].type === 'estilo', 'Case 1: Flaw type mismatch');
    assert(result.flaws[0].suggestion === 'Isvimed', 'Case 1: Flaw suggestion mismatch');
    assert(result.flaws[0].original === 'ISVIMED', 'Case 1: Flaw original mismatch');
    console.log("✓ Case 1 passed");
  }

  // Case 2: Flaw without suggestion
  {
    const input = 'El costo es <FLAW Type="formato">$20000</FLAW>.';
    const result = processFlawTags(input);
    assert(result.cleanText === 'El costo es $20000.', 'Case 2: Clean text mismatch');
    assert(result.flaws.length === 1, 'Case 2: Flaw count mismatch');
    assert(result.flaws[0].type === 'formato', 'Case 2: Flaw type mismatch');
    assert(result.flaws[0].suggestion === undefined, 'Case 2: Flaw suggestion mismatch');
    console.log("✓ Case 2 passed");
  }

  // Case 3: Multiple flaws
  {
    const input = '<FLAW Type="a" Suggestion="A">a</FLAW> y <FLAW Type="b" Suggestion="B">b</FLAW>';
    const result = processFlawTags(input);
    assert(result.cleanText === 'A y B', 'Case 3: Clean text mismatch');
    assert(result.flaws.length === 2, 'Case 3: Flaw count mismatch');
    console.log("✓ Case 3 passed");
  }

  // Case 4: No flaws
  {
    const input = 'Texto limpio sin errores.';
    const result = processFlawTags(input);
    assert(result.cleanText === 'Texto limpio sin errores.', 'Case 4: Clean text mismatch');
    assert(result.flaws.length === 0, 'Case 4: Flaw count mismatch');
    console.log("✓ Case 4 passed");
  }

  // Case 5: Attributes robustness (order, casing, spaces)
  {
    const input = '<FLAW  Suggestion="Correct"   Type="test" >Wrong</FLAW>';
    const result = processFlawTags(input);
    assert(result.cleanText === 'Correct', 'Case 5: Clean text mismatch');
    assert(result.flaws[0].type === 'test', 'Case 5: Type mismatch');
    assert(result.flaws[0].suggestion === 'Correct', 'Case 5: Suggestion mismatch');
    console.log("✓ Case 5 passed");
  }

  // Case 6: Nested or complex content
  {
    const input = 'Start <FLAW Type="complex" Suggestion="Fixed">Original\nText</FLAW> End';
    const result = processFlawTags(input);
    assert(result.cleanText === 'Start Fixed End', 'Case 6: Clean text mismatch');
    assert(result.flaws[0].original === 'Original\nText', 'Case 6: Original content mismatch');
    console.log("✓ Case 6 passed");
  }

  console.log("All tests passed!");
}

runTests();
