import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  closeE2eApp,
  createE2eApp,
  registerAndLogin,
} from './helpers/e2e-bootstrap';

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

    const ingredientId = ingRes.body.id as string;

    await request(app.getHttpServer())
      .put(`/pantry/items/${ingredientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 500, unit: 'g' })
      .expect(200)
      .expect((res) => {
        expect(res.body.quantity).toBe(500);
        expect(res.body.unit).toBe('g');
      });

    const listRes = await request(app.getHttpServer())
      .get('/pantry')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      (listRes.body as { ingredientId: string }[]).some(
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

    await request(app.getHttpServer())
      .put(`/pantry/items/${flour.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1000, unit: 'g' })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/pantry/items/${water.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1000, unit: 'ml' })
      .expect(200);

    const recipeRes = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `E2E bread ${suffix}` })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/recipes/${recipeRes.body.id}/ingredients`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ingredients: [
          { ingredientId: flour.body.id, quantity: 500, unit: 'g' },
          { ingredientId: water.body.id, quantity: 300, unit: 'ml' },
        ],
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/recipes/${recipeRes.body.id}/publish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const suggestions = await request(app.getHttpServer())
      .get('/suggestions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(suggestions.body).toHaveProperty('available');
    expect(suggestions.body).toHaveProperty('almostAvailable');
    expect(suggestions.body).toHaveProperty('needsMore');

    const readyIds = (suggestions.body.available as { id: string }[]).map(
      (r) => r.id,
    );
    const almostIds = (suggestions.body.almostAvailable as { id: string }[]).map(
      (r) => r.id,
    );
    const needsMoreIds = (suggestions.body.needsMore as { id: string }[]).map(
      (r) => r.id,
    );

    expect(readyIds).toContain(recipeRes.body.id);
    expect(almostIds).not.toContain(recipeRes.body.id);
    expect(needsMoreIds).not.toContain(recipeRes.body.id);

    await request(app.getHttpServer())
      .delete(`/recipes/${recipeRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });
});
