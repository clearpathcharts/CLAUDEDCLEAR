# ClearPath Engineering Constitution
## Reality Enforcement Spec

### Section 1: No Fake Features Rule
A feature may not appear in the user interface unless a working implementation exists.
**Forbidden:**
* Placeholder indicators
* Fake scanners
* Fake AI signals
* Fake heatmaps
* Fake economic releases
* Fake news feeds
* Fake institutional tools
* Fake indicator counts

If implementation is missing, the feature must remain hidden.

### Section 2: Registry Validation Rule
Every registry entry must resolve to a real file.
**Example:**
* *Allowed:* EMA -> indicators/EMA.ts, RSI -> indicators/RSI.ts, MACD -> indicators/MACD.ts
* *Forbidden:* EMA -> missing, RSI -> TODO, MACD -> placeholder

### Section 3: Indicator Verification Rule
Every indicator must contain:
1. Input Data
2. Calculation Logic
3. Output Data
4. Rendering Logic

If any are missing, the indicator cannot be shown.

### Section 4: Automatic Startup Validation
At startup:
* For each indicator, verify file exists, verify `calculate()` exists, verify output exists, and verify rendering exists.
* Otherwise, disable the indicator.

### Section 5: UI Truthfulness Rule
**Forbidden:**
* "5,000 Indicators Ready"
* "100% Institutional"
* "AI Prediction Engine"
* "Professional Scanner"
* "Market Profile"
* (unless actual implementation exists)

### Section 6: Fake AI Detection Rule
**Forbidden:**
* "BUY SIGNAL"
* "SELL SIGNAL"
* "STRONG BUY"
* "AI SCORE"
* (if generated from a random number, hardcoded values, dummy data, or placeholder code)

Every displayed signal must reference source indicators, source calculations, and confidence logic.

### Section 7: Build Failure Rule
The build should fail if a registry item exists but its implementation is missing. For example, if `ICHIMOKU` is in the registry, but `Ichimoku.ts` (or mapped file) does not exist, the build must fail.

### Section 8: Production Audit Report
Before deployment, generate:
* Indicator Audit Report
* Fundamental Audit Report
* Institutional Audit Report
* (showing: Implemented, Partially Implemented, Missing, Disabled)

### Section 9: No Marketing Numbers
**Forbidden:**
* "5000 Indicators"
* "10000 Signals"
* "Institutional Grade"
* "AI Powered"
* "Professional Analytics"
* (unless measurable proof exists)

### Section 10: Reality Enforcement Engine
The validator suite (`src/core/audit/RealityValidator.ts`, `RegistryAuditor.ts`, etc.) must run checks and verify what exists, what works, what is missing, and what is disabled.
