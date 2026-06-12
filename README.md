Distributed API Gateway & Telemetry Dashboard
An enterprise-grade, multi-tenant API gateway traffic monitoring network engineered to handle real-time rate limiting, asynchronous telemetry logging, and live visualization syncs. This project is built using the MERN stack but scales horizontally by offloading heavy computational tasks to Redis in-memory token buckets and BullMQ background processing threads, keeping API endpoint latency down to milliseconds.

Key Architectural Highlights (What I Mastered)
Sliding-Window Rate Limiting: Built custom gateway middleware using Redis memory keys to track tenant consumption rates on the fly.

Asynchronous Telemetry: Engineered a decoupled system architecture using BullMQ. Standard request logging tasks are fast-offloaded to background queues, preventing API traffic blocks.

Bi-directional Live Streaming: Implemented full-duplex Socket.io WebSocket channels to broadcast layout state adjustments and analytical distribution shifts to active dashboard interfaces instantly.

Server-Side Document Rendering: Integrated a streaming binary PDF compiler pipeline using PDFKit to generate dynamic cryptographic SLA report statements.

System Architecture & Data Flow
The architecture is explicitly designed to decouple heavy write operations from the main HTTP request-response cycle:

Client Request: Frontend hits the gateway playground resource endpoint (/api/v1/tenants/resource).

Cache Verification: Middleware checks the Redis Cache for tenant active token scopes. If absent, it reads from MongoDB Atlas and caches it.

Token Bucket Evaluation: Increments an IP/API Key-bound minute bucket inside Redis. If bounds are breached, it intercepts and throws a 429 Too Many Requests error.

Queue Offloading: The final request metadata package is pushed into BullMQ.

Worker Aggregation & WebSocket Broadcast: A background worker thread processes the job queue, updates MongoDB Usage Logs, aggregates success/blocked ratios, and pushes fresh metrics live via WebSockets.

Tech Stack Matrix
Frontend UI: React, Vite, Tailwind CSS, Framer Motion, Chart.js, Lucide Icons

Gateway App Server: Node.js, Express.js

In-Memory Cache & Message Broker: Redis Cloud, BullMQ

Persistent Data Storage: MongoDB Atlas, Mongoose ODM

Real-Time Stream Engine: Socket.io (WebSockets)

Directory Layout Tree

frontend/
├── src/
│   ├── components/   # Modular UI panels (Profiles, Playgrounds, Canvas Charts)
│   ├── App.jsx       # Global application framework state & Socket connectors
│   └── main.jsx
├── index.html
└── package.json


backend/
├── src/
│   ├── config/       # Databases (MongoDB, Redis) & Queue (BullMQ) Workers
│   ├── controllers/  # Core business logic & Document compilation engines
│   ├── middleware/   # Custom Rate Limiter & Registration Security Guards
│   ├── models/       # Mongoose Schemas (Tenant profiles, Usage logs)
│   ├── routes/       # Centralized Express endpoint router system
│   └── server.js     # Express App orchestration & Socket.io mount gate
└── package.json

Local Installation & Setup Setup
Follow these exact execution steps to spin up this project on your local environment:

Prerequisites
Ensure you have the following services active on your operating system:

Node.js (v18+ recommended)

MongoDB (Local service or MongoDB Atlas cluster connection string)

Redis running on default port 6379

1. Configure Environmental Parameters
Create a .env file inside your /backend root directory:

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/rate_limiter_db
REDIS_URL=redis://127.0.0.1:6379

2. Launch the Core Backend Service
Open a fresh terminal window, move to the backend directory, install packages, and boot the server:

cd backend
npm install
npm run dev

Your terminal console should confirm successful connection loops to Redis, MongoDB, and Socket pipes sequential lines.

3. Launch the Frontend Client Interface
Open a secondary terminal window alongside your active backend thread, run package indexing, and start the Vite environment:

cd frontend
npm install
npm run dev

Open http://localhost:5173 in your browser web view to begin interacting with the playground!

Simulation Testing Routine
1.Click Mint New Pass on the dashboard header to generate an active developer token profile directly in your database.

2.Hit Execute Request Trigger multiple times to send API hits down to the proxy rules engine.

3.Observe how requests clean out dynamically until you hit your strategy limit threshold cap, triggering an explicit 429 Rate Limit Breached! layout interceptor.

4.Hit Sync Cluster to watch Chart.js render and adjust analytical vector slices live over WebSocket updates.

5.Click Export Data Statement to download a clean, structurally compiled system audit statement PDF.
