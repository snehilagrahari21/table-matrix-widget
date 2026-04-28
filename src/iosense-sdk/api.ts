const STAGING_BASE = 'https://stagingsv.iosense.io/api';
const GRAPH = 'iosense_test_uns';

export async function validateSSOToken(ssoToken: string): Promise<string> {
  const res = await fetch(`${STAGING_BASE}/account/validateSSO`, {
    method: 'GET',
    headers: { token: ssoToken },
  });
  const json = await res.json();
  if (!json.success || !json.token) throw new Error('SSO validation failed');
  return json.token;
}

export async function resolveAndCompute(
  authentication: string,
  config: Array<{ key: string; topic: string }>,
  startTime: number,
  endTime: number,
): Promise<Array<{ key: string; value: string | number | null }>> {
  const res = await fetch(`${STAGING_BASE}/account/uns/resolveAndCompute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authentication}`,
    },
    body: JSON.stringify({ graph: GRAPH, config, startTime, endTime }),
  });
  const json = await res.json();
  return (json?.data ?? []) as Array<{ key: string; value: string | number | null }>;
}
