import { createServer } from 'http';
import { Server } from 'socket.io';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { setupSocketHandlers } from '../../lib/webrtc/socketHandler';

describe('Signaling Server', () => {
  let io: Server, serverSocket: any, clientSocket1: ClientSocket, clientSocket2: ClientSocket;
  let port: number;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    setupSocketHandlers(io);
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      clientSocket1 = Client(`http://localhost:${port}`);
      clientSocket2 = Client(`http://localhost:${port}`);
      
      let connections = 0;
      io.on('connection', (socket) => {
        serverSocket = socket;
      });

      clientSocket1.on('connect', () => {
        connections++;
        if (connections === 2) done();
      });
      clientSocket2.on('connect', () => {
        connections++;
        if (connections === 2) done();
      });
    });
  });

  afterAll(() => {
    io.close();
    clientSocket1.close();
    clientSocket2.close();
  });

  it('should allow users to join a room', (done) => {
    const roomId = 'test-room';
    
    clientSocket1.emit('join-room', { roomId });
    
    // First user joins, shouldn't get all-users yet in theory or might get empty
    clientSocket1.on('all-users', (users) => {
      expect(users).toEqual([]);
      
      // Wait a tick for second user to join
      setTimeout(() => {
        clientSocket2.emit('join-room', { roomId });
      }, 50);
    });

    clientSocket2.on('all-users', (users) => {
      expect(users.length).toBe(1);
      expect(users[0]).toBe(clientSocket1.id);
    });

    clientSocket1.on('user-joined', (payload) => {
      expect(payload.callerId).toBe(clientSocket2.id);
      clientSocket1.removeAllListeners('all-users');
      clientSocket1.removeAllListeners('user-joined');
      clientSocket2.removeAllListeners('all-users');
      done();
    });
  });

  it('should relay offer to specific user', (done) => {
    const offerPayload = { to: clientSocket2.id, offer: { type: 'offer', sdp: 'test-sdp' } };
    
    clientSocket2.on('offer', (payload) => {
      expect(payload.from).toBe(clientSocket1.id);
      expect(payload.offer.sdp).toBe('test-sdp');
      clientSocket2.removeAllListeners('offer');
      done();
    });

    clientSocket1.emit('offer', offerPayload);
  });

  it('should relay answer to specific user', (done) => {
    const answerPayload = { to: clientSocket1.id, answer: { type: 'answer', sdp: 'test-sdp-answer' } };
    
    clientSocket1.on('answer', (payload) => {
      expect(payload.from).toBe(clientSocket2.id);
      expect(payload.answer.sdp).toBe('test-sdp-answer');
      clientSocket1.removeAllListeners('answer');
      done();
    });

    clientSocket2.emit('answer', answerPayload);
  });

  it('should broadcast text chat messages to room', (done) => {
    const chatData = { roomId: 'test-room', message: 'Hello World', sender: 'Alice', timestamp: 12345 };
    
    clientSocket2.on('chat-message', (payload) => {
      expect(payload.from).toBe(clientSocket1.id);
      expect(payload.message).toBe('Hello World');
      expect(payload.sender).toBe('Alice');
      expect(payload.timestamp).toBe(12345);
      clientSocket2.removeAllListeners('chat-message');
      done();
    });

    clientSocket1.emit('chat-message', chatData);
  });

});
