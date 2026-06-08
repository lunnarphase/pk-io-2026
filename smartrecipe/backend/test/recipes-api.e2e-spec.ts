import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  closeE2eApp,
  createE2eApp,
  registerAndLogin,
} from './helpers/e2e-bootstrap';
import { asBody, IdBody, RecipeBody } from './helpers/e2e-types';

/**
 * RF01 / RF02 / RF03 — functional API tests for recipe CRUD and lifecycle.
 * Requires PostgreSQL (docker compose up -d).
 */
describe('Recipes API (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createE2eApp();
    ({ token } = await registerAndLogin(app, 'recipes-api'));
  }, 30_000);

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('RF01: creates, reads, updates and deletes a recipe', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'E2E Makaron' })
      .expect(201);

    const created = asBody<RecipeBody>(createRes.body);
    const recipeId = created.id;
    expect(created.lifecycleStatus).toBe('DRAFT');

    await request(app.getHttpServer())
      .get(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(asBody<RecipeBody>(res.body).title).toBe('E2E Makaron');
      });

    await request(app.getHttpServer())
      .patch(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ servings: 4 })
      .expect(200)
      .expect((res) => {
        expect(asBody<RecipeBody>(res.body).servings).toBe(4);
      });

    await request(app.getHttpServer())
      .delete(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('RF02: rejects recipe creation without required title', async () => {
    await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });

  it('RF03: rejects invalid lifecycle transition DRAFT -> ARCHIVED', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Lifecycle test' })
      .expect(201);

    const recipeId = asBody<IdBody>(createRes.body).id;

    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    await request(app.getHttpServer())
      .delete(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('RF03: allows DRAFT -> ACTIVE -> ARCHIVED -> ACTIVE', async () => {
    const ingRes = await request(app.getHttpServer())
      .post('/ingredients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `E2E lifecycle ${Date.now()}` })
      .expect(201);

    const ingredientId = asBody<IdBody>(ingRes.body).id;

    const createRes = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Valid lifecycle' })
      .expect(201);

    const recipeId = asBody<IdBody>(createRes.body).id;

    await request(app.getHttpServer())
      .put(`/recipes/${recipeId}/ingredients`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ingredients: [
          {
            ingredientId,
            quantity: 100,
            unit: 'g',
          },
        ],
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/publish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) =>
        expect(asBody<RecipeBody>(res.body).lifecycleStatus).toBe('ACTIVE'),
      );

    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) =>
        expect(asBody<RecipeBody>(res.body).lifecycleStatus).toBe('ARCHIVED'),
      );

    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/unarchive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) =>
        expect(asBody<RecipeBody>(res.body).lifecycleStatus).toBe('ACTIVE'),
      );

    await request(app.getHttpServer())
      .delete(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });
});
