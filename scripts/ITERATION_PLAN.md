# ACTAGEN Iterative Improvement Plan
Based on Ruth Navarro's feedback [2026-01-30]

## Iteration 1: Formatting Engine Update
- **Task:** Update the TEI/XML to DOCX converter or styling rules.
- **Rules:**
    - Citations: Arial 11 (if body is 12).
    - Speaker Change: `\n\n` (two spaces).
    - Acronym Logic: `len(acronym) > 4 ? title_case : upper_case`.
    - No bold in intervention bodies.
- **Status:** PENDING

## Iteration 2: Entity & Role Resolver
- **Task:** Implement a cross-check logic for speaker names and roles.
- **Rules:**
    - Scan the entire document for Name -> Role mappings.
    - If a Name appears without a Role, inject the previously discovered Role.
    - Flag spelling discrepancies of the same name for human review.
- **Status:** PENDING

## Iteration 3: Quality Control (Artifact Removal)
- **Task:** Add a filter for "stray letters" and transcription artifacts.
- **Rules:**
    - Identify single characters at the end of paragraphs or isolated in lines.
    - Flag potential context errors (e.g., phonetic similarities like viven/vienen).
- **Status:** PENDING

## Iteration 4: Multimedia Integration (Assistance Only)
- **Task:** Map transcription chunks to YouTube timestamps.
- **Goal:** Create a side-car tool or metadata layer that allows the human to click a paragraph and open the YouTube link at that exact second.
- **Status:** PENDING

## Iteration 5: Annex Verification
- **Task:** Extract "Communications" and "Propositions" headers.
- **Rule:** Cross-reference extracted items with a list of files in the `Annex` folder.
- **Status:** PENDING
