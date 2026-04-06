// Shared TypeScript interfaces for all Socket.IO signaling payloads

export interface JoinRoomPayload {
  roomId: string;
}

export interface AllUsersPayload {
  users: string[]; // array of socket IDs already in the room
}

export interface UserJoinedPayload {
  callerId: string; // socket ID of the new peer
}

export interface UserDisconnectedPayload {
  socketId: string;
}

export interface OfferPayload {
  offer: RTCSessionDescriptionInit;
  to: string;   // target socket ID (outbound)
  from?: string; // sender socket ID (inbound from server)
}

export interface AnswerPayload {
  answer: RTCSessionDescriptionInit;
  to: string;
  from?: string;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
  to: string;
  from?: string;
}

export interface ChatMessagePayload {
  roomId: string;
  message: string;
  sender: string;
  timestamp: number;
  from?: string; // socket ID (added by server on inbound)
}

// Connection state for the call UI
export type ConnectionStatus = 'waiting' | 'connecting' | 'connected';
