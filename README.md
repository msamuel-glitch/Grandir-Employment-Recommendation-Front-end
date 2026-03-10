# BloomPath — AI Recruitment Intelligence Platform (Frontend)

![React](https://img.shields.io/badge/React-Frontend-61DAFB) ![Vite](https://img.shields.io/badge/Vite-Build-646CFF) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-38BDF8) ![Deployed](https://img.shields.io/badge/Deployed-Vercel-black)

## Overview

This is the React frontend for **BloomPath** — an automated recruitment intelligence platform built for **Grandir**, one of France's largest childcare networks (150+ nurseries across France).

The frontend provides a real-time dashboard interface for Grandir's recruitment team to view matched candidates, nursery vacancies, and geospatial placement recommendations — replacing a fully manual 30-day process.

**The Flask backend is available at:** [Grandir-Employment-Recommendation](https://github.com/msamuel-glitch/Grandir-Employment-Recommendation)

---

## Features

- Real-time candidate-to-nursery matching dashboard
- Geospatial display of nursery locations across France
- Candidate profile cards with match scoring
- Vacancy urgency indicators
- Responsive UI built with TailwindCSS

---

## Tech Stack

- **Framework:** React (Vite)
- **Styling:** TailwindCSS
- **Build Tool:** Vite
- **Deployment:** Vercel
- **API:** Connects to Flask backend (Render)

---

## File Structure

```
/src              → React components and pages
index.html        → Entry point
package.json      → Dependencies
tailwind.config.js → TailwindCSS configuration
vite.config.js    → Vite build configuration
```

---

## How to Run Locally

```bash
# Clone the repo
git clone https://github.com/msamuel-glitch/Grandir-Employment-Recommendation-Front-end.git
cd Grandir-Employment-Recommendation-Front-end

# Install dependencies
npm install

# Start development server
npm run dev
```

App will be available at `http://localhost:5173`

> Make sure the Flask backend is running locally or point the API URL to the Render deployment.

---

## Results

- Processes **42,681 candidate records** in real-time
- Reduced recruitment matching cycle from **30 days → real-time**
- 5 production deployments on Vercel
- Received direct interest from Grandir leadership team

---

## Context

Built as part of the **Business Deep Dive** module at **Albert School × Mines Paris PSL** — a hands-on program where students work directly on real operational problems with partner companies.
