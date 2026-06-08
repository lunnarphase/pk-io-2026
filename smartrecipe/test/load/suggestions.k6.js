/**
 * RNF01 — load smoke test for GET /suggestions (UC03).
 *
 * Prerequisites:
 *   1. PostgreSQL: docker compose up -d (from smartrecipe/)
 *   2. Backend:    cd backend && pnpm start:dev
 *   3. k6 installed: https://k6.io/docs/get-started/installation/
 *
 * Run:
 *   k6 run test/load/suggestions.k6.js
 *
 * Env overrides:
 *   K6_BASE_URL=http://localhost:3000
 *   K6_VUS=10
 *   K6_DURATION=30s
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const VUS = Number(__ENV.K6_VUS || 10);
const DURATION = __ENV.K6_DURATION || '30s';

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export function setup() {
  const email = `load-${Date.now()}@k6.test`;
  const password = 'LoadTest123!';

  const register = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(register, { 'register status 201': (r) => r.status === 201 });

  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(login, { 'login status 200': (r) => r.status === 200 });

  const token = login.json('accessToken');
  return { token };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/suggestions`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });

  check(res, {
    'suggestions status 200': (r) => r.status === 200,
    'suggestions has buckets': (r) => {
      const body = r.json();
      return (
        Array.isArray(body.available) &&
        Array.isArray(body.almostAvailable) &&
        Array.isArray(body.needsMore)
      );
    },
  });

  sleep(0.2);
}
