import request from 'supertest';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

describe('Health Check API', () => {
  let server: any;

  beforeAll(async () => {
    await app.prepare();
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });
  });

  it('GET /api/health should return ok', async () => {
    const res = await request(server).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  afterAll((done) => {
    server.close(done);
  });
});
