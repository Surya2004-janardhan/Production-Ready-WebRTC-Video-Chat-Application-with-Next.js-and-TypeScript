import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { setupSocketHandlers } from '../../lib/webrtc/socketHandler';

describe('Signaling error cases', () => {
  let io: Server, serverSocket: any, clientSocket: any; let port: number; let httpServer: any;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    setupSocketHandlers(io);
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', () => done());
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  it('emitting offer to non-existent socket does not crash server and no offer received', (done) => {
    const fakeTarget = 'non-existent-id-xyz';
    let received = false;

    clientSocket.on('offer', () => { received = true; });

    // emit offer to a fake id; there is no listener so client should not receive it
    clientSocket.emit('offer', { to: fakeTarget, offer: { type: 'offer', sdp: 'x' } });

    setTimeout(() => {
      expect(received).toBe(false);
      done();
    }, 150);
  });
});
