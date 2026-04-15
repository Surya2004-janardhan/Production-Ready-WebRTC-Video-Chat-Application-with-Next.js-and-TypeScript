import { Server, Socket } from 'socket.io';

interface JoinRoomPayload {
  roomId: string;
}

interface SignalPayload {
  to: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface ChatPayload {
  roomId: string;
  message: string;
  sender: string;
  timestamp: number;
}

export function setupSocketHandlers(io: Server) {
  // Room → Set of socket IDs
  const rooms = new Map<string, Set<string>>();

  io.on('connection', (socket: Socket) => {
    console.log('[socket] connected:', socket.id);

    // ── join-room ──────────────────────────────────────────────────────────
    socket.on('join-room', ({ roomId }: JoinRoomPayload) => {
      socket.join(roomId);

      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      const room = rooms.get(roomId)!;

      // Send the new peer the list of everyone already here
      const existingUsers = Array.from(room);
      socket.emit('all-users', existingUsers);

      // Notify existing peers that someone new arrived
      socket.to(roomId).emit('user-joined', { callerId: socket.id });

      room.add(socket.id);
      console.log(`[room:${roomId}] join — peers: ${room.size}`);
    });

    // ── WebRTC signaling ───────────────────────────────────────────────────
    socket.on('offer', (payload: SignalPayload) => {
      io.to(payload.to).emit('offer', { offer: payload.offer, from: socket.id });
    });

    socket.on('answer', (payload: SignalPayload) => {
      io.to(payload.to).emit('answer', { answer: payload.answer, from: socket.id });
    });

    socket.on('ice-candidate', (payload: SignalPayload) => {
      io.to(payload.to).emit('ice-candidate', { candidate: payload.candidate, from: socket.id });
    });

    // ── text chat ──────────────────────────────────────────────────────────
    socket.on('chat-message', ({ roomId, message, sender, timestamp }: ChatPayload) => {
      io.to(roomId).emit('chat-message', { message, sender, timestamp, from: socket.id });
    });

    // ── disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log('[socket] disconnected:', socket.id);
      rooms.forEach((peers, roomId) => {
        if (peers.has(socket.id)) {
          peers.delete(socket.id);
          socket.to(roomId).emit('user-disconnected', { socketId: socket.id });
          if (peers.size === 0) rooms.delete(roomId);
        }
      });
    });
  });
  
  return rooms; // exported for testing purposes if needed
}
