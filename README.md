# Production-Ready WebRTC Video Chat Application

This repository implements a small, production-minded WebRTC video chat app using a mesh topology and a custom Socket.IO signaling server. It is intended as a reference implementation for small group peer-to-peer video calls with integrated text chat and clear extension points for scaling (SFU/TURN/etc.).

Key goals:
- Working, end-to-end WebRTC call flow (offer/answer, ICE, tracks)
- Simple, testable signaling server implementation
- Clear separation of concerns via hooks and small modules
- Containerized for reproducible deployment

---

## Features

- Mesh video calls (direct P2P RTCPeerConnection per peer)
- Socket.IO signaling for SDP/ICE and text chat
- Local media capture, mute/camera controls, and graceful hangup
- Optimistic chat UI with server broadcast
- Jest tests for signaling and peer factory logic
- Docker + docker-compose for dev/prod parity

---

## Tech stack

- Frontend: Next.js 14 (App Router), React, TypeScript
- Signaling: Node + Socket.IO
- WebRTC: browser APIs (RTCPeerConnection, MediaStream)
- Tests: Jest
- Containerization: Docker, docker-compose

---

## Quickstart (development)

1. Install dependencies:

```bash
npm install
```

2. Copy environment template (optional):

```bash
cp .env.example .env
```

3. Start dev server (Next + Socket.IO signaling):

```bash
npm run dev
```

Open http://localhost:3000 and create/join a room. Use a second browser or an incognito window to test multi-peer behavior.

---

## Docker (recommended for submission demos)

```bash
docker-compose up --build
```

The app is available at http://localhost:3000. The compose setup ensures a stable runtime that mirrors production.

---

## How it works — end-to-end (technical)

1. User loads the homepage (`app/page.tsx`) and creates/pastes a UUID room id. A route `/room/[roomId]` is opened.
2. The client obtains a `MediaStream` via `getUserMedia` (`hooks/useUserMedia.ts`).
3. `useSignaling` connects to the Socket.IO server and emits `join-room` with `roomId`.
4. Server-side `setupSocketHandlers` (`lib/webrtc/socketHandler.ts`) stores the socket id in an in-memory `Map<roomId, Set<socketId>>`, joins the socket to the room, then emits `all-users` (list of existing socket ids) back to the newcomer.
5. Newcomer calls `initiateCall(peerId)` for each id in `all-users`. `useWebRTC` creates an `RTCPeerConnection` via `lib/webrtc/peerFactory.ts`, attaches local tracks and creates an SDP `offer`.
6. Offers, answers, and ICE candidates are exchanged over Socket.IO events (`offer`, `answer`, `ice-candidate`). These are small JSON messages — the server relays them one-to-one to target socket ids.
7. Once `RTCPeerConnection` is connected and `ontrack` fires, remote `MediaStream`s are stored in a `Map` inside `useWebRTC`. `RoomPage.tsx` renders streams using `VideoTile`.
8. Chat messages use the same Socket.IO channel (`chat-message`) and are broadcast to the room by the server.

Notes: media (audio/video) never traverses the Socket.IO server — sockets only carry signaling and chat.

---

## Important files to read

- `server.ts` — app + signaling server bootstrap
- `lib/webrtc/socketHandler.ts` — server-side signaling handlers and room map
- `lib/webrtc/peerFactory.ts` — RTCPeerConnection factory and ICE/STUN config
- `components/RoomPage.tsx` — room orchestration and UI glue
- `hooks/` — `useSignaling`, `useWebRTC`, `useUserMedia`, `useChat`

---

## Testing

Run unit and integration tests with:

```bash
npm test
```

Relevant tests are under `tests/unit` and `tests/integration` and cover `peerFactory` and the signaling handler behavior.

---

## Deployment notes

- In production you should provide TURN servers (for reliable NAT traversal), secure signaling endpoints (TLS), and lock down Socket.IO CORS origin. Update `NEXT_PUBLIC_STUN_SERVER` and add TURN credentials.
- The in-memory room map is fine for demo/small deployments but requires a persistent/clustered approach (Redis or similar) for multi-process scaling.

---

## Submission checklist (what to include for evaluation)

- Steps to run locally and in Docker (commands above).
- Short explanation of architecture and trade-offs (mesh vs SFU, why Socket.IO was chosen).
- Tests passing (`npm test`) and instructions to run them.
- Notes on limitations and next steps (TURN, SFU, auth) — see **Recommended improvements** below.

---

## Recommended improvements (next steps)

- Add TURN servers and TLS for production reliability.
- Replace mesh with SFU (mediasoup/Janus) for rooms > 6 participants.
- Add authentication and secure room access (tokens / ACLs).
- Instrument peer connection stats and add monitoring dashboards.

---

If you want, I can now: provide a one-page summary for submission, generate a sequence diagram for the offer/answer flow, or open and summarize the exact state machines in `hooks/useWebRTC.ts` and `hooks/useSignaling.ts`.

