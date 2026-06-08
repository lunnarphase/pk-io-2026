#!/usr/bin/env node
/**
 * Reads Jest/Vitest coverage summaries and prints a markdown snippet
 * for RAPORT_TESTOW.md. Run after:
 *   cd backend && pnpm test:cov
 *   cd frontend && pnpm test:cov
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readCoverage(path) {
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const total = raw.total;
  if (!total) return null;
  const pct = (entry) => entry?.pct ?? 0;
  return {
    statements: pct(total.statements),
    branches: pct(total.branches),
    functions: pct(total.functions),
    lines: pct(total.lines),
  };
}

const be = readCoverage(join(root, 'backend/coverage/coverage-summary.json'));
let fe = readCoverage(join(root, 'frontend/coverage/coverage-summary.json'));

if (!fe && existsSync(join(root, 'frontend/coverage/coverage-final.json'))) {
  const files = JSON.parse(
    readFileSync(join(root, 'frontend/coverage/coverage-final.json'), 'utf8'),
  );
  let sCovered = 0;
  let sTotal = 0;
  let bCovered = 0;
  let bTotal = 0;
  let fCovered = 0;
  let fTotal = 0;

  for (const entry of Object.values(files)) {
    for (const id of Object.keys(entry.statementMap ?? {})) {
      sTotal += 1;
      if ((entry.s?.[id] ?? 0) > 0) sCovered += 1;
    }
    for (const id of Object.keys(entry.fnMap ?? {})) {
      fTotal += 1;
      if ((entry.f?.[id] ?? 0) > 0) fCovered += 1;
    }
    for (const id of Object.keys(entry.branchMap ?? {})) {
      const locs = entry.branchMap[id].locations ?? [];
      const counts = entry.b?.[id] ?? [];
      bTotal += locs.length;
      for (let i = 0; i < locs.length; i += 1) {
        if ((counts[i] ?? 0) > 0) bCovered += 1;
      }
    }
  }

  const pct = (covered, total) =>
    total ? Math.round((covered / total) * 10000) / 100 : 0;

  fe = {
    statements: pct(sCovered, sTotal),
    branches: pct(bCovered, bTotal),
    functions: pct(fCovered, fTotal),
    lines: pct(sCovered, sTotal),
  };
}

const fmt = (c) =>
  c
    ? `| Stmts ${c.statements}% | Branch ${c.branches}% | Funcs ${c.functions}% | Lines ${c.lines}% |`
    : '| _brak danych — uruchom test:cov_ |';

console.log('## Pokrycie kodu (auto-generated)\n');
console.log('| Warstwa | Statements | Branches | Functions | Lines |');
console.log('|---------|------------|----------|-----------|-------|');
if (be) {
  console.log(
    `| Backend | ${be.statements}% | ${be.branches}% | ${be.functions}% | ${be.lines}% |`,
  );
}
if (fe) {
  console.log(
    `| Frontend | ${fe.statements}% | ${fe.branches}% | ${fe.functions}% | ${fe.lines}% |`,
  );
}
console.log('\n```');
console.log('Backend :', fmt(be));
console.log('Frontend:', fmt(fe));
console.log('```');
