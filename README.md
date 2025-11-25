# API Testing Tool - Backend

## Summary

This is the backend/proxy server for the API Testing Tool. It handles forwarding API requests, saving request history and collections to Supabase, and enforces user-level isolation. It exposes RESTful endpoints for the frontend app and persists data in a Supabase Postgres instance.

## Features

- Secure proxy for any HTTP API request (GET/POST/PUT/DELETE/PATCH)
- Insert each sent request into a per-user history (in Supabase)
- Manage request collections per user (save, list, retrieve)
- Endpoints for single history deletion and clear-all-history
- CORS-enabled for local frontend development
- Loads secrets from `.env`, never expose
- Express-based, easily deployable on any Node environment

## Tech stack

- Node.js 18+
- Express
- Axios
- Supabase JS SDK
- dotenv

## Screenshots

Backend is HTTP API only; see [frontend screenshots](../frontend/README.md) for UI.

## Installation

Clone the repository
git clone https://github.com/ChetuM10/api-testing-tool.git
cd api-testing-tool/BackEnd

Install dependencies
npm install

Set up environment variables
cp .env.example .env

Fill in SUPABASE_URL and SUPABASE_KEY (service role recommended)
Start the backend server (default port: 5000)
npm start

or
node index.js

text

_Note:_ By default, the backend listens on port 5000 and expects the frontend to be running separately.

You can further customize the Summary and Features sections to match your unique features or branding. Add or update screenshot links if you have actual images for visual documentation.
