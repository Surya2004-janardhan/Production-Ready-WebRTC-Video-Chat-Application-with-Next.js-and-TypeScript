# Production-Ready WebRTC Video Chat Application

A multi-peer video conferencing and real-time text chat platform built with modern technologies.

## 🚀 Features

- **Mesh Topology Video Calls**: Support for up to 4 concurrent participants with direct P2P connections.
- **Custom WebSocket Signaling**: Built-in signaling server using Node.js and Socket.IO.
- **Full Call Controls**: Mute/unmute microphone, toggle camera, and graceful hangup.
- **Real-Time Text Chat**: Integrated message panel with auto-scrolling and optimistic updates.
- **Aesthetic UI**: Dark-mode design with glassmorphism, responsive grid layouts, and smooth animations.
- **Containerized Deployment**: Fully configured with Docker and Docker Compose.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Vanilla CSS
- **Signaling**: Socket.IO, custom Node.js HTTP server
- **P2P Communication**: WebRTC (RTCPeerConnection, MediaStream API)
- **Containerization**: Docker, Docker Compose

## 📦 Setup & Installation

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Docker Deployment (Recommended)

Run the entire application in a containerized environment with a single command:
```bash
docker-compose up --build
```
The application will be accessible at [http://localhost:3000](http://localhost:3000). A health check is automatically performed against the `/api/health` endpoint.

## 📐 Architecture Overview

The system uses a **Mesh Topology**. Every participant in a room connects directly to every other participant.

1. **Signaling**: When a user joins a room (UUID-based), they connect to the WebSocket server. The server tracks room occupancy and relays SDP offers, answers, and ICE candidates between peers.
2. **Media Negotiation**:
   - Newcomer receives a list of existing peers.
   - Newcomer initiates a call with each peer.
   - SDP handshake (Offer/Answer) is exchanged over the signaling channel.
   - ICE candidates are trickled to establish the most efficient P2P path.
3. **Media Streaming**: Once the connection state becomes `connected`, the remote MediaStream is added to the UI grid.

## 🧪 Testing

A health check API is available at `/api/health`. Automated tests for signaling and room logic can be run via:
```bash
npm test
```

## 🛡️ License

This project is built for the GPP Advanced Agentic Coding task.
