# EcoComply — Manufacturing Compliance System

Full-stack compliance dashboard with a React/Vite frontend and Express API. The current backend uses **in-memory demo storage**; it does not connect to MongoDB.

## Run locally

1. Install dependencies in both `backend` and `frontend` with `npm install`.
2. Copy `backend/.env.example` to `backend/.env`, then set a unique `JWT_SECRET`.
3. Start the backend with `npm run dev` from `backend`.
4. Start the frontend with `npm run dev` from `frontend`, then open the Vite URL shown in the terminal.

The Vite development server proxies `/api` requests to `http://localhost:5000`.

## Demo storage warning

Users and compliance records are stored in the backend process's memory. They disappear when that process restarts, scales down, or is redeployed. Vercel may route requests to different serverless instances, each with separate memory, so data and login sessions are not reliable across requests. This mode is for demos only—not real compliance records or production use.

## Deploy to Vercel

Import the repository with its root directory set to `./`; the root `vercel.json` routes the frontend and Express API as separate services. Add `JWT_SECRET` as a sensitive Production and Preview environment variable in Vercel. `MONGO_URI` is not used in in-memory demo mode. Do not commit `.env` files.

After deployment, check `/api/health` for API status and its storage-mode warning.