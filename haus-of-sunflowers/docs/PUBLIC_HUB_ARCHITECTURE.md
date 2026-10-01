# Haus of Sunflowers Public Hub Architecture

## Product rule
The app is one business hub with distinct pathways. Existing Hoodoo research, formulation tools, materia, historical map, archival documentation, and private dissertation work remain intact. They are not collapsed into consultations, self-technologies, or psychology-informed education.

## Five public pathways

### Explore
Historical research and documentation.
- Historical Research
- Historical Map
- Sources / provenance
- Search by topic, location, source, practice, ingredient, date, and keyword

Private dissertation content is excluded unless intentionally republished into a public research surface.

### Formulate
Companion area for *The Rootworker's Formulary*.
- Formulary
- Materials / materia
- Formula Builder
- Ingredient comparison
- Formula testing against approved book logic

This pathway remains Hoodoo/formulation-specific and does not automatically influence personal consultations.

### Practice
Self-technologies, stored separately from research/formulation.
Each practice supports:
- overview
- purpose
- instructions
- recommended frequency
- reflection prompts
- related resources
- contraindications / limitations
- research support where applicable

Practice Builder may only organize approved self-technologies already in the app. It is nonclinical and may not diagnose, provide psychotherapy, or create treatment plans.

### Learn
Classroom / educational content.
- courses
- modules
- video, text, exercise, download, or mixed lessons
- downloads
- exercises
- progress tracking
- recommended next lessons

Only intentionally added course content appears.

### Work With Me
Services are separate from the content systems.

Consultation:
- one consultation service
- reading included by default but optional
- opting out of a reading does not create a cheaper service
- intake asks what the client wants to explore, useful outcome, focus area, reading preference, approaches to avoid, and additional context
- nonclinical scope

Standalone Reading:
- separate service offering
- separate intake
- no consultation required

## Private workspace
- Import Center
- Dissertation

These remain owner tools and are not public pathways.

## Schemas
- `research`: Hoodoo archive, materia, formulation, historical evidence
- `dissertation`: private dissertation work
- `import`: source intake / staging
- `practice`: self-technologies, resources, user routines
- `learning`: courses, modules, lessons, downloads, progress
- `services`: offerings, scheduling rules, bookings, intakes, private notes, followups
- `assistant`: AI tool definitions and run/audit records
- `api`: narrow public/client-facing RPC surfaces

## AI bottleneck tools

### App Navigator
Allowed: navigation and already-published app content.
Forbidden: inventing outside resources, diagnosis, therapy.

### Research Search Assistant
Allowed: approved historical archive and sources.
Requirement: cite internal sources.
Forbidden: private dissertation access; uncited external claims.

### Formulary Assistant
Allowed: book content, approved materia, Formula Builder.
Forbidden: outside materia presented as book content; consultation inference.

### Practice Builder
Allowed: approved self-technologies and practice resources.
Forbidden: diagnosis, psychotherapy, treatment planning, unapproved practices.

### Course Matcher
Allowed: courses and lessons intentionally added to the app.
Forbidden: invented courses or outside course recommendations presented as internal content.

### Consultation Intake Summarizer
Allowed: submitted consultation intake.
Forbidden: diagnosis, therapy, clinical assessment.

### Post-Consultation Resource Tool
Allowed: resources explicitly selected by the owner.
Forbidden: diagnosis, treatment plans, automatic use of private research.

## Cross-domain rules
1. Hoodoo archival research does not automatically enter a personal consultation.
2. Formulation data does not become consultation guidance by default.
3. Dissertation data never becomes public automatically.
4. Self-technology routines are nonclinical.
5. Classroom content is opt-in editorial content, not auto-imported material.
6. AI retrieval is domain-scoped. Each tool gets only the source domains it needs.
7. Any future clinical service must be added intentionally as a separate licensed service layer rather than redefining the current app.
