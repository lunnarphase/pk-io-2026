# SmartRecipe — uruchamianie testów

**Raport z wyników:** [RAPORT_TESTOW.md](../../RAPORT_TESTOW.md) · **Plan testów:** [PLAN_TESTOW.md](../../PLAN_TESTOW.md)

## Szybki start

```bash
# Baza (wymagana dla E2E)
cd smartrecipe
docker compose up -d

# Backend: unit + coverage + E2E
cd backend
pnpm test:all

# Frontend: unit + coverage
cd ../frontend
pnpm test:cov

# Obciążeniowy RNF01 (osobny terminal: backend + k6)
winget install GrafanaLabs.k6   # Windows, jednorazowo
cd backend && pnpm start:dev
cd .. && k6 run test/load/suggestions.k6.js
```

Wynik k6: [test/load/last-run-summary.md](load/last-run-summary.md) — **PASS** (p95 ≈ 12 ms)

## Struktura

| Katalog | Zawartość | Liczba testów (8.06.2026) |
|---------|-----------|---------------------------|
| `backend/src/**/*.spec.ts` | Jednostkowe (15) + modułowe w `*.service.spec.ts` (120) | 135 |
| `backend/test/*.e2e-spec.ts` | Funkcjonalne API (Supertest + PostgreSQL) | 10 |
| `frontend/src/**/*.test.ts(x)` | Jednostkowe UI (Vitest) | 138 |
| `test/load/` | Obciążeniowe k6 (RNF01, poza punktem 6 zajęć) | — |

**Razem:** 283 testy automatyczne — wszystkie OK.

## Dokumentacja projektu

- [PLAN_TESTOW.md](../../PLAN_TESTOW.md)
- [RAPORT_TESTOW.md](../../RAPORT_TESTOW.md)

## CI

Pull requesty uruchamiają workflow w `.github/workflows/backend-ci.yml` i `frontend-ci.yml`.
