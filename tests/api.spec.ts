import { expect, test, type APIRequestContext } from '@playwright/test';

const apiBaseURL = process.env.API_BASE_URL ?? process.env.APP_BASE_URL ?? 'http://127.0.0.1:8081';
const apiKey = process.env.E2E_API_KEY;
const apiAgentEmail = process.env.E2E_API_AGENT_EMAIL;
const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

test.beforeEach(async ({ request }) => {
  const health = await request.get(`${apiBaseURL}/api/health`);
  test.skip(
    health.status() === 404,
    'The configured app does not register its API routes; enable routes/api.php to run API scenarios',
  );
  expect(health.ok(), 'API health endpoint should be available').toBeTruthy();
});

async function apiHeaders(): Promise<Record<string, string>> {
  test.skip(!apiKey, 'Set E2E_API_KEY in .env');
  return {
    Accept: 'application/json',
    'X-API-Key': apiKey!,
  };
}

async function responseData(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<unknown> {
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('API response did not contain a data property');
  }
  return body.data;
}

async function createDraft(request: APIRequestContext): Promise<string | number> {
  const data = await apiHeaders();
  const response = await request.post(`${apiBaseURL}/api/applications`, {
    headers: data,
    data: apiAgentEmail ? { agent_email: apiAgentEmail } : {},
  });
  expect(response.status()).toBe(201);
  const body = await responseData(response);
  if (!body || typeof body !== 'object' || !('id' in body)) {
    throw new Error('Draft creation response did not include an application id');
  }
  if (typeof body.id !== 'string' && typeof body.id !== 'number') {
    throw new Error('Draft creation returned an invalid application id');
  }
  return body.id;
}

test('API-V01: products endpoint returns a product catalog', async ({ request }) => {
  const headers = await apiHeaders();
  const response = await request.get(`${apiBaseURL}/api/products`, {
    headers,
    timeout: 60_000,
  });
  expect(response.ok()).toBeTruthy();

  const data = await responseData(response);
  expect(Array.isArray(data)).toBeTruthy();
  expect(data).not.toHaveLength(0);
});

test('API-V02: application API requires the configured API key', async ({ request }) => {
  const response = await request.get(`${apiBaseURL}/api/applications`);
  expect(response.status()).toBe(401);
});

test('API-V03: authenticated application list returns application records', async ({ request }) => {
  const headers = await apiHeaders();
  const url = new URL(`${apiBaseURL}/api/applications`);
  if (apiAgentEmail) {
    url.searchParams.set('agent_email', apiAgentEmail);
  }
  const response = await request.get(url.toString(), { headers });
  expect(response.ok()).toBeTruthy();
  expect(Array.isArray(await responseData(response))).toBeTruthy();
});

test('API-V04: a product detail endpoint returns product details', async ({ request }) => {
  const headers = await apiHeaders();
  const catalogResponse = await request.get(`${apiBaseURL}/api/products`, { headers });
  expect(catalogResponse.ok()).toBeTruthy();
  const catalog = await responseData(catalogResponse);
  expect(Array.isArray(catalog)).toBeTruthy();
  const firstProduct: unknown = Array.isArray(catalog) ? catalog[0] : undefined;
  if (!firstProduct || typeof firstProduct !== 'object' || !('id' in firstProduct)) {
    throw new Error('Product catalog did not contain a product id');
  }

  const response = await request.get(
    `${apiBaseURL}/api/products/${String(firstProduct.id)}`,
    { headers },
  );
  expect(response.ok()).toBeTruthy();
  expect(await responseData(response)).toBeTruthy();
});

test('API-V05: rider catalog endpoint returns rider data', async ({ request }) => {
  const headers = await apiHeaders();
  const response = await request.get(`${apiBaseURL}/api/riders`, { headers });
  expect(response.ok()).toBeTruthy();
  expect(Array.isArray(await responseData(response))).toBeTruthy();
});

test('API-V06: client API rejects an invalid date of birth', async ({ request }) => {
  const applicationId = await createDraft(request);
  const headers = await apiHeaders();
  const response = await request.post(
    `${apiBaseURL}/api/applications/${applicationId}/client`,
    {
      headers,
      data: {
        first_name: 'Taylor',
        last_name: 'Sample',
        date_of_birth: '2099-01-01',
        gender: 'FEMALE',
        marital_status: 'SINGLE',
        nationality: 'United States',
        occupation: 'Quality Analyst',
        employer_name: 'Sample Company',
        employer_address: '10 Sample Road',
      },
    },
  );
  expect([400, 422]).toContain(response.status());
});

test('API-V07: validation endpoint reports incomplete application errors', async ({ request }) => {
  const applicationId = await createDraft(request);
  const headers = await apiHeaders();
  const response = await request.post(
    `${apiBaseURL}/api/applications/${applicationId}/validate`,
    { headers },
  );
  expect(response.status()).toBe(422);
  const body: unknown = await response.json();
  expect(JSON.stringify(body)).toMatch(/error|valid|issue|required/i);
});

test('API-V08: beneficiary API returns allocation and beneficiary data', async ({ request }) => {
  const applicationId = await createDraft(request);
  const headers = await apiHeaders();
  const response = await request.get(
    `${apiBaseURL}/api/applications/${applicationId}/beneficiaries`,
    { headers },
  );
  expect(response.ok()).toBeTruthy();
  expect(Array.isArray(await responseData(response))).toBeTruthy();
});

test('API-V09: submission endpoint blocks an invalid application', async ({ request }) => {
  const applicationId = await createDraft(request);
  const headers = await apiHeaders();
  const response = await request.post(
    `${apiBaseURL}/api/applications/${applicationId}/submit`,
    { headers },
  );
  expect(response.status()).toBe(422);
});

test('API-V10: draft status endpoint returns the current status', async ({ request }) => {
  const applicationId = await createDraft(request);
  const headers = await apiHeaders();
  const response = await request.get(
    `${apiBaseURL}/api/applications/${applicationId}/status`,
    { headers },
  );
  expect(response.ok()).toBeTruthy();
  expect(JSON.stringify(await responseData(response))).toMatch(/status|draft/i);
});

test('API-V11: application API rejects an invalid API key', async ({ request }) => {
  const response = await request.get(`${apiBaseURL}/api/applications`, {
    headers: { 'X-API-Key': 'invalid-test-api-key' },
  });
  expect(response.status()).toBe(401);
});

test('API-V12: document API rejects an unsupported file type', async ({ request }) => {
  const applicationId = await createDraft(request);
  const headers = await apiHeaders();
  const response = await request.post(
    `${apiBaseURL}/api/applications/${applicationId}/documents`,
    {
      headers,
      multipart: {
        document_type: 'KYC_ID',
        document: {
          name: 'unsupported.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('synthetic test document'),
        },
      },
    },
  );
  expect(response.status()).toBe(422);
});

test('API-AUTH-V01: API login accepts valid agent credentials', async ({ request }) => {
  test.skip(!username || !password, 'Set E2E_USERNAME and E2E_PASSWORD in .env');
  const headers = await apiHeaders();
  const response = await request.post(`${apiBaseURL}/api/login`, {
    headers,
    data: { email: username, password },
  });
  expect(response.ok()).toBeTruthy();
  const data = await responseData(response);
  expect(data).toEqual(expect.objectContaining({ email: username }));
});
