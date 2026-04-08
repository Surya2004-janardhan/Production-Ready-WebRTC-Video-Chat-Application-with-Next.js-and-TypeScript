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

    let connected = 0;
    const checkDone = () => { connected++; if (connected === 2) proceed(); };

    client.emit('join-room', { roomId });
    otherClient.on('connect', () => checkDone());
    otherClient.on('connect', () => otherClient.emit('join-room', { roomId }));

    function proceed() {
      // both in room now; disconnect otherClient and ensure server emits user-disconnected
      client.once('user-disconnected', (payload: any) => {
        expect(payload.socketId).toBeDefined();
        otherClient.close();
        done();
      });

      otherClient.close();
    }
  });
});
