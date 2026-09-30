# Forma — Week 09 Custom Form Validation

Multi-step registration form with real-time regex validation, clear error messaging, password visibility toggle, and true Theme Mode.

## Purpose

Week 09 of the Freelancer 100-week development program.  
Roadmap requirement: **Custom Form Validation — multi-step registration form with real-time regex validation and error messaging.**

## Design Features Used
(from FRONT-END-DESIGN-FEATURES.txt)

- Multi-step form / wizard pattern
- Real-time field validation states (valid / invalid)
- Inline error messaging
- Password visibility toggle
- Progress indicator (steps + bar)
- Summary / confirmation step
- Success state
- Floating-style inputs with focus rings
- Theme-aware geometry and surfaces
- Accessible form controls and labels

## Features

- 3-step flow: Account → Profile → Confirm
- Real-time regex validation on blur + while correcting
- Password rules: min 8 chars, 1 uppercase, 1 number
- Username rules: 3–20 chars, alphanumeric + underscore
- Password show/hide toggle
- Progress bar + step indicators
- Confirmation summary before submit
- Success state (demo — no real backend)
- True Theme Mode (Noir / Lumen)
- `localStorage` theme preference
- Fully keyboard accessible
- Zero dependencies

## Validation Rules

| Field     | Rule                                      |
|-----------|-------------------------------------------|
| Email     | Standard email format                     |
| Password  | ≥8 chars, 1 uppercase, 1 number           |
| Confirm   | Must match password                       |
| Full name | At least 2 characters                     |
| Username  | 3–20 chars, letters/numbers/underscores   |
| Role      | Required selection                        |
| Terms     | Must be checked                           |

## How to Run

Open `index.html` or:

```bash
npx serve .
```

## Project Structure

```
week-09-form-validation/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 1 · Week 09**
