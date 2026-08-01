import {
  defaultDocumentEvidenceTransport,
  defaultEvidenceTransport
} from '../evidence';

describe('evidence transport authorization', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('sends the per-submission token on list, photo upload, document upload, and delete', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockImplementation(() => Promise.resolve({
      ok: true,
      status: 204,
      json: () => Promise.resolve({ evidence: [] })
    }));

    await defaultEvidenceTransport.list('sub_1', 'token-1');
    await defaultEvidenceTransport.upload('sub_1', new Blob(['photo'], { type: 'image/png' }), 'photo.png', 'token-1');
    await defaultDocumentEvidenceTransport.upload(
      'sub_1',
      new Blob(['work order'], { type: 'text/plain' }),
      'work-order.txt',
      'work_order',
      'token-1'
    );
    await defaultEvidenceTransport.remove('sub_1', 'ev_1', 'token-1');

    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers).toEqual(expect.objectContaining({ 'x-evidence-token': 'token-1' }));
    }
  });
});
