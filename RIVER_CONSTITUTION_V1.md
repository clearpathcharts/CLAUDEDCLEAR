# CLEARPATH RIVER DEVELOPMENT CONSTITUTION V1

## MASTER RULE

CLEARPATH RIVER MASTER FILE TREE V1 IS THE SINGLE SOURCE OF TRUTH.

No AI system may alter the architecture without explicit approval.

---

# ARCHITECTURE LOCK

DO NOT:

* Rename folders
* Rename services
* Rename runtimes
* Rename packages
* Rename importers
* Rename integrations
* Rename SDKs
* Rename marketplace modules
* Rename security modules

Folder names are locked.

---

DO NOT:

* Create new top-level folders
* Create alternative architectures
* Create replacement architectures
* Create competing architectures

Only use folders already defined in:

CLEARPATH RIVER MASTER FILE TREE V1

---

DO NOT:

* Move modules
* Relocate services
* Merge unrelated modules
* Collapse directories
* Flatten architecture

Every module must remain inside its assigned folder.

---

# SOLITAIRE RULE

Build one card at a time.

Do not rebuild previous cards.

Do not reorganize completed cards.

Do not refactor completed architecture unless explicitly instructed.

Development must be additive only.

New code may be added.

Existing structure may not be altered.

---

# NO SHORTCUTS RULE

Do not:

* Create mock systems
* Create fake APIs
* Create placeholder compilers
* Create placeholder runtimes
* Create placeholder importers

Build production-grade implementations whenever possible.

If something cannot be fully implemented:

Document the limitation.

Do not fake functionality.

---

# COMPILER FIRST RULE

Build in this order only:

1. packages/rir
2. compilers
3. runtimes
4. charts
5. services
6. storage
7. security
8. importers
9. ui
10. integrations
11. marketplace

Never skip steps.

Never build later layers before earlier layers exist.

---

# RIVER IR RULE

All imported languages must eventually convert into:

River Intermediate Representation (RIR)

No language may bypass RIR.

All execution must flow through:

Language
↓
Importer
↓
Compiler
↓
RIR
↓
Runtime
↓
Charts

---

# IMPORTER RULE

Importers may only:

Read source language

Convert source language

Generate RIR

Importers may not:

Execute code

Render charts

Store user data

Perform marketplace functions

---

# RUNTIME RULE

Runtimes execute.

Importers import.

Compilers compile.

Services serve.

Charts render.

Each subsystem has one responsibility.

No cross-contamination.

---

# SECURITY RULE

Never sacrifice architecture for convenience.

Security modules remain isolated.

Authentication remains isolated.

Authorization remains isolated.

Secrets remain isolated.

Code signing remains isolated.

---

# PLUGIN RULE

New languages must be added through plugins.

Never modify core runtime for language expansion.

Use plugin architecture.

---

# AI RULE

AI is optional.

AI is not a dependency.

The platform must function without AI.

AI may assist.

AI may not control architecture.

---

# CHANGE CONTROL RULE

Before any architecture change:

Provide:

Current State

Proposed Change

Impact Analysis

Affected Modules

Approval Required

No silent modifications.

---

# FILE TREE IMMUTABILITY RULE

The following is immutable:

CLEARPATH RIVER MASTER FILE TREE V1

It remains the authoritative architecture unless explicitly superseded by:

CLEARPATH RIVER MASTER FILE TREE V2

No partial replacements allowed.

No hybrid versions allowed.

No automatic upgrades allowed.

---

END OF CONSTITUTION
