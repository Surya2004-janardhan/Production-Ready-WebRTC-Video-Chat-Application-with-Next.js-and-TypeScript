import { GET } from '../app/api/health/route';

describe('Health Check API', () => {
  it('GET /api/health should return ok', async () => {
    const res = await GET();
    
    expect(res.status).toBe(200);
    
    // NextResponse.json resolves its body context asynchronously or via .json()
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.timestamp).toBeDefined();
  });
});
