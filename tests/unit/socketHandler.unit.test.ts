import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { setupSocketHandlers } from '../../lib/webrtc/socketHandler';

describe('Socket handler unit behaviors', () => {
  let io: Server; let client: any; let httpServer: any; let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    setupSocketHandlers(io);
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      client = Client(`http://localhost:${port}`);
      client.on('connect', () => done());
    });
  });

  afterAll(() => {
    io.close();
    client.close();
    httpServer.close();
  });

  it('returns an empty all-users array when first joining a room', (done) => {
    const roomId = 'unit-room';
    client.emit('join-room', { roomId });

    client.once('all-users', (users: string[]) => {
      expect(Array.isArray(users)).toBeTruthy();
      expect(users.length).toBe(0);
      done();
    });
  });

  it('cleans up rooms on disconnect', (done) => {
    const roomId = 'cleanup-room';
    const otherClient = Client(`http://localhost:${port}`);

    otherClient.on('connect', () => {
      // both clients join the room
      client.emit('join-room', { roomId });
      otherClient.emit('join-room', { roomId });

      // small delay to ensure server processed joins
      setTimeout(() => {
        client.once('user-disconnected', (payload: any) => {
          expect(payload.socketId).toBeDefined();
          // cleanup
          otherClient.close();
          done();
        });

        // trigger disconnect for other client
        otherClient.close();
      }, 50);
    });
  });
});
