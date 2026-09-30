# Skye — Week 11 Weather Dashboard

Search any city for current conditions and a 5-day forecast. Built with the free Open-Meteo API (no API key required).

## Purpose

Week 11 of the Freelancer 100-week development program.  
Roadmap requirement: **Weather Dashboard — fetch data from a weather API to display current conditions and a 5-day forecast based on user search.**

This begins **Phase 2: Interactive JavaScript & APIs**.

## Design Features Used
(from FRONT-END-DESIGN-FEATURES.txt)

- Search input with icon
- Status / live region messaging
- Current conditions hero card
- Detail stat chips
- Forecast card grid
- Empty state with suggestion chips
- Loading / error feedback
- Theme-aware surfaces, geometry, and type
- Responsive card layouts

## Features

- City search with geocoding
- Current temperature, description, feels-like, humidity, wind, precipitation
- 5-day forecast (high / low + weather icon)
- Suggestion chips for quick searches
- Loading and error states
- True Theme Mode (Noir / Lumen)
- `localStorage` theme preference
- Fully responsive
- No API key required (Open-Meteo)
- Zero build step

## API

- Geocoding: `https://geocoding-api.open-meteo.com`
- Weather: `https://api.open-meteo.com`

Both are free for non-commercial use and require no key.

## How to Run

Open `index.html` or:

```bash
npx serve .
```

Needs a network connection to fetch live data.

## Project Structure

```
week-11-weather-dashboard/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 2 · Week 11**
