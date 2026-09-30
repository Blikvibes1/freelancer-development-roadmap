# Reel — Week 12 Movie Search App

Search movies via the OMDb API, view details in a modal, and save favorites to localStorage.

## Purpose

Week 12 of the Freelancer 100-week development program.  
Roadmap requirement: **Movie Search App — use the OMDb API to search movies, display details, and save favorites to local storage.**

## Design Features Used
(from FRONT-END-DESIGN-FEATURES.txt)

- Search field with icon
- Movie / media card grid
- Poster thumbnails
- Favorites toggle (heart)
- Detail modal with focus management
- Empty state + suggestion chips
- Status messaging
- Theme-aware surfaces and geometry

## Features

- Search OMDb by title
- Results grid with posters
- Click card → detail modal (plot, rating, genre, director)
- Add / remove favorites (persisted in `localStorage`)
- Favorites view
- Suggestion chips for quick searches
- Loading & error states
- True Theme Mode (Noir / Lumen)
- Accessible modal (Escape, backdrop, focus restore)
- Zero build step

## Setup (required)

1. Get a free API key: https://www.omdbapi.com/apikey.aspx  
2. Open `script.js`  
3. Replace `YOUR_OMDB_API_KEY` with your key  

```js
const OMDB_KEY = "your_key_here";
```

Without a key the app will show a clear message asking you to add one.

## How to Run

```bash
npx serve .
```

Needs network access for OMDb.

## Project Structure

```
week-12-movie-search/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

**Freelancer Development Program · Phase 2 · Week 12**
