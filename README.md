# EcoComply — Manufacturing Compliance System

Full-stack compliance dashboard with a React/Vite frontend, Express API, and MongoDB.

## Run locally

1. Install dependencies in both `backend` and `frontend` with `npm install`.
2. Copy `backend/.env.example` to `backend/.env`, then set `MONGO_URI` and a unique `JWT_SECRET`.
3. Start the backend with `npm run dev` from `backend`.
4. Start the frontend with `npm run dev` from `frontend`, then open the Vite URL shown in the terminal.

The Vite development server proxies `/api` requests to `http://localhost:5000`.

## Deploy to Vercel

Import the repository with its root directory set to `./`; the root `vercel.json` routes the frontend and Express API as separate services. Configure `MONGO_URI` and `JWT_SECRET` as sensitive Production and Preview environment variables in Vercel. Do not commit `.env` files. For MongoDB Atlas, allow connections from the deployment environment in the cluster's Network Access settings.

After deployment, check `/api/health` for API status and its database connection state.