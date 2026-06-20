# Reality Enforcement Specification

Refer to the primary ClearPath Engineering Constitution at `/docs/CLEARPATH_ENGINEERING_CONSTITUTION.md` for full details.

## Core Mandates

### Section 1: No Fake Features Rule
Features without working, real implementations are strictly prohibited in the UI. All placeholder banners, random mockup panels, uncalculated buy/sell widgets, and fake signals are disallowed.

### Section 2: Registry Validation Rule
Every item in our technical, fundamental, or institutional registries must resolve to a real source calculation file.

### Section 3: Indicator Verification Rule
Every active indicator must prove its data pipeline: Input -> Calculation -> Output -> Rendering.

### Section 4: Automatic Startup Validation
On platform boot, the `RealityValidator` scans all registries and physically audits files + function exports. Any component lacking concrete implementation is disabled.

### Section 5: UI Truthfulness Rule
No marketing jargon or unsubstantiated numbers ("5000 Indicators", "AI Predictors") are permitted unless backed by real system calculations.

### Section 6: Fake AI Detection Rule
No fake or randomly-generated trading signals. Outputs must trace back to tangible calculated indicators with verifiable math.

### Section 7: Build Failure Rule
If any registry item is declared but its backing source file is missing, the build process must immediately fail.

### Section 8: Production Audit Report
An automated validation sweep generates live reports during compilation detailing Implemented, Partially Implemented, or Missing components.

### Section 9: No Marketing Numbers
All quantitative claims must be exact matches of our registry index counts.

### Section 10: Reality Enforcement Engine
Located in `src/core/audit/*`, this module executes high-fidelity verification checks.
