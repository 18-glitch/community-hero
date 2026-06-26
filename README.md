# Community Hero — Hyperlocal Civic Action Platform

Community Hero is an AI-powered web application that enables citizens across India to identify, report, track, and resolve hyperlocal civic issues such as potholes, water leakages, broken streetlights, garbage dumps, and damaged roads. The platform combines Gemini Vision AI, real-time mapping, community collaboration, and gamification to bring transparency and accountability to local governance.

Built for the BlockseBlock Hackathon 2026 using Google AI Studio, Gemini API, Firebase Firestore, and Leaflet/OpenStreetMap.

## Live Demo

[Community Hero — Live App](https://community-hero-46322879785.asia-southeast1.run.app)

## Problem Statement

Communities across India face daily civic issues — potholes, water leakages, broken streetlights, overflowing garbage — but reporting systems are fragmented, untransparent, and impossible to track. Citizens have no way to know if their complaint was heard, who is responsible, or when it will be resolved.

Community Hero solves this by building a single transparent platform where citizens report, verify, upvote, and track issues — with AI doing the heavy lifting.

## Features

### Hyperlocal Map (Home Page)

The home screen displays a live interactive map powered by Leaflet and OpenStreetMap showing all reported civic issues across India as color-coded geo-pins. Red pins indicate open issues, amber pins indicate issues in progress, and green pins indicate resolved issues. The map includes a Hotspot Heatmap overlay that identifies areas with the highest concentration of unresolved reports. Clicking any issue pin or incident card instantly pans and zooms the map to that location.

### Issue Reporting (File Hazard)

Citizens report issues through a simple flow — upload a photo, enter location, describe the issue, select category and severity, and submit. Location is captured automatically via GPS or manually selected on the map. Voice input supports Hindi and English via the Web Speech API, transcribing spoken descriptions directly into the form.

### Duplicate Detection and Hotspot Merging

When a new report is submitted, the platform checks if an existing report of the same category exists within 100 meters. If a duplicate is detected, the new report is automatically merged with the existing one as a collaborative upvote, keeping the map clean and accurate.

### Citizen Ledger (Issues List)

The Citizen Ledger displays all reported issues as detailed cards showing the photo thumbnail, title, description, category tag, severity badge, location, and time since reporting. Each issue shows a real-time status progress bar tracking its lifecycle from Reported through Verified and In Progress to Resolved. Citizens can upvote issues to indicate urgency.

### Admin Resolution Approval with Gemini Vision

When a citizen uploads a resolution photo, the issue moves to Pending Verification status instead of immediately resolving. Only the admin (rohithboyini181@gmail.com) sees the Approve Resolution button. When admin clicks Approve, Gemini Vision compares the original issue photo against the resolution photo and confirms if the issue is genuinely fixed. If verified, the issue is marked Resolved and the citizen earns 150 points and a trust score boost.

### Impact Dashboard

The Impact Dashboard presents real-time analytics including total issues reported, resolution rate, average resolution time, and top locality by activity. It includes a Category Demographics bar chart and a Critical Hotspot Nodes panel identifying localities with the highest unresolved report counts. Gemini generates predictive neighborhood health insights based on recurring patterns.

### Leaderboard and Gamification

Citizens earn points for reporting verified issues, upvoting, and having resolutions approved. The Leaderboard ranks citizens by points and trust score per locality, encouraging consistent civic participation.

### Google Authentication

Users sign in with their Google account via Firebase Authentication. Each user has their own profile, point balance, and trust score displayed in the navigation bar.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Build Tool | Vite |
| Backend | Express + TypeScript |
| Database | Firebase Firestore |
| Authentication | Firebase Auth (Google Sign-in) |
| AI / Vision | Gemini Vision API |
| Maps | Leaflet + OpenStreetMap |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Voice Input | Web Speech API |
| Deployment | Google Cloud Run via AI Studio |

## Google Technologies Used

- Google AI Studio — primary development and deployment platform
- Gemini Vision API — resolution photo verification, before/after comparison, predictive insights
- Firebase Firestore — real-time NoSQL database
- Firebase Authentication — Google Sign-in for citizen identity
- Google Cloud Run — production deployment and hosting

## Getting Started

Clone the repository:

```bash
git clone https://github.com/18-glitch/community-hero
cd community-hero
```

Install dependencies:

```bash
npm install
```

Create a `.env` file and add your Gemini API key:
GEMINI_API_KEY=your_gemini_api_key_here

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Evaluation Criteria Alignment

**Problem Solving & Impact (20%)** — Complete end-to-end civic issue reporting with transparency, tracking, and resolution verification.

**Agentic Depth (20%)** — Gemini Vision autonomously verifies resolution photos, compares before/after images, and generates predictive insights.

**Innovation & Creativity (20%)** — Combines duplicate hotspot merging, admin-gated AI resolution verification, bilingual voice reporting, and gamification in a single civic platform.

**Usage of Google Technologies (15%)** — Google AI Studio, Gemini Vision API, Firebase Firestore, Firebase Authentication, Google Cloud Run.

**Product Experience & Design (10%)** — Dark theme with orange accents, glassmorphism cards, smooth animations, mobile-friendly responsive layout.

**Technical Implementation (10%)** — Full-stack TypeScript with React frontend, Express backend, real-time Firestore, and Gemini Vision API.

**Completeness & Usability (5%)** — All five pages functional: Map, Report Form, Issues List, Impact Dashboard, and Leaderboard.