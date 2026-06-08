import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  closeE2eApp,
  createE2eApp,
  registerAndLogin,
} from './helpers/e2e-bootstrap';
import {
  asBody,
  IdBody,
  PantryItemBody,
  SuggestionsBody,
} from './helpers/e2e-types';

/**
 * RF05 / RF06 — pantry management and suggestions integration.
 * Requires PostgreSQL (docker compose up -d).
 */
describe('Pantry & Suggestions API (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createE2eApp();
    ({ token } = await registerAndLogin(app, 'pantry-suggestions'));
  }, 30_000);

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('RF05: upserts and removes pantry items', async () => {
    const ingRes = await request(app.getHttpServer())
      .post('/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `E2E flour ${Date.now()}` })
      .expect(201);

    const ingredientId = asBody<IdBody>(ingRes.body).id;

    await request(app.getHttpServer())
      .put(`/pantry/items/${ingredientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 500, unit: 'g' })
      .expect(200)
      .expect((res) => {
        const body = asBody<PantryItemBody>(res.body);
        expect(body.quantity).toBe(500);
        expect(body.unit).toBe('g');
      });

    const listRes = await request(app.getHttpServer())
      .get('/pantry')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      asBody<{ ingredientId: string }[]>(listRes.body).some(
        (item) => item.ingredientId === ingredientId,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .delete(`/pantry/items/${ingredientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('RF06: returns deterministic suggestion buckets', async () => {
    const suffix = Date.now();
    const flour = await request(app.getHttpServer())
      .post('/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `E2E wheat ${suffix}` })
      .expect(201);
    const water = await request(app.getHttpServer())
      .post('/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `E2E water ${suffix}` })
      .expect(201);

    const flourId = asBody<IdBody>(flour.body).id;
    const waterId = asBody<IdBody>(water.body).id;

    await request(app.getHttpServer())
      .put(`/pantry/items/${flourId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1000, unit: 'g' })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/pantry/items/${waterId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1000, unit: 'ml' })
      .expect(200);

    const recipeRes = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `E2E bread ${suffix}` })
      .expect(201);

    const recipeId = asBody<IdBody>(recipeRes.body).id;

    await request(app.getHttpServer())
      .put(`/recipes/${recipeId}/ingredients`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ingredients: [
          { ingredientId: flourId, quantity: 500, unit: 'g' },
          { ingredientId: waterId, quantity: 300, unit: 'ml' },
        ],
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/publish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const suggestions = await request(app.getHttpServer())
      .get('/suggestions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = asBody<SuggestionsBody>(suggestions.body);
    expect(body).toHaveProperty('available');
    expect(body).toHaveProperty('almostAvailable');
    expect(body).toHaveProperty('needsMore');

    const readyIds = body.available.map((r) => r.id);
    const almostIds = body.almostAvailable.map((r) => r.id);
    const needsMoreIds = body.needsMore.map((r) => r.id);

    expect(readyIds).toContain(recipeId);
    expect(almostIds).not.toContain(recipeId);
    expect(needsMoreIds).not.toContain(recipeId);

    await request(app.getHttpServer())
      .delete(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });
});
