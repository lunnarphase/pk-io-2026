# RNF01 — ostatni przebieg testu obciążeniowego k6

**Data:** 08.06.2026  
**Narzędzie:** k6 v2.0.0 (Grafana)  
**Skrypt:** `suggestions.k6.js`  
**API:** `http://localhost:3000` (backend lokalny + PostgreSQL Docker)

## Parametry

| Parametr | Wartość |
|----------|---------|
| Endpoint | `GET /suggestions` (z JWT) |
| VUs | 10 |
| Czas trwania | 30 s |
| Iteracje | 1451 |
| Żądania HTTP | 1453 |

## Progi (thresholds)

| Próg | Wymaganie | Wynik | Status |
|------|-----------|-------|--------|
| `http_req_duration` p(95) | &lt; 2000 ms | **12.02 ms** | PASS |
| `http_req_failed` rate | &lt; 5% | **0.00%** | PASS |

## Metryki

| Metryka | Wartość |
|---------|---------|
| Średni czas odpowiedzi | 7.36 ms |
| Mediana | 5.79 ms |
| p(90) | 9.92 ms |
| p(95) | 12.02 ms |
| Max | 350.92 ms |
| Checks | 2906/2906 (100%) |

## Werdykt

**RNF01 spełnione** — p95 znacznie poniżej limitu 2 s przy 10 równoległych użytkownikach.

Surowy eksport JSON: `last-run-summary.json`
