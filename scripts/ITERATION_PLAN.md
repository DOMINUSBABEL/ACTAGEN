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

## Iteration 7: Legislative Cross-Referencing (V10.1)
- **Task:** Verify "Título" and "Preámbulo" accuracy against source legislative documents.
- **Goal:** In "Segundo Debate" scenarios, the engine must compare the transcribed title/preamble with the official "Informe de Ponencia para Segundo Debate".
- **Requirements:**
    - Identify the Project Number (e.g., N° 067 de 2025).
    - Search for the corresponding Report (Informe de Ponencia).
    - Flag any deviation between the transcribed text and the official legislative wording.
- **Status:** PENDING (Added per user request 2026-02-03)

## Iteration 6: Legal Liaison & Consultation (V10)
- **Task:** Automation for consulting logical discrepancies with legal staff.
- **Goal:** Generate a draft email or message for "la abogada" (Ruth or specific interviniente) when a `[Nota: Posible error...]` flag is raised.
- **Requirements:**
    - Reference the Acta number.
    - Quote the suspicious paragraph.
    - Provide a link to the YouTube timestamp (if available from Iteration 4).
- **Status:** PENDING (Added per user request 2026-02-03)
