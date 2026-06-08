import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { User } from '../src/domain/entities/user.entity';
import {
  closeE2eApp,
  createE2eApp,
  registerAndLogin,
} from './helpers/e2e-bootstrap';
import { asBody, IdBody } from './helpers/e2e-types';

/**
 * RNF04 / RNF05 — cross-user isolation and password storage.
 * Requires PostgreSQL (docker compose up -d).
 */
describe('Cross-user security (e2e)', () => {
  let app: INestApplication<App>;
  let ownerToken: string;
  let otherToken: string;
  let ownerEmail: string;

  beforeAll(async () => {
    app = await createE2eApp();
    ({ token: ownerToken, email: ownerEmail } = await registerAndLogin(
      app,
      'owner',
    ));
    ({ token: otherToken } = await registerAndLogin(app, 'other'));
  }, 30_000);

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('RNF04: returns 403 when accessing another user recipe', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Private recipe' })
      .expect(201);

    const recipeId = asBody<IdBody>(createRes.body).id;

    await request(app.getHttpServer())
      .get(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hijacked' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);
  });

  it('RNF04: isolates pantry data between users', async () => {
    const ingRes = await request(app.getHttpServer())
      .post('/ingredients')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `E2E salt ${Date.now()}` })
      .expect(201);

    const ingredientId = asBody<IdBody>(ingRes.body).id;

    await request(app.getHttpServer())
      .put(`/pantry/items/${ingredientId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quantity: 100, unit: 'g' })
      .expect(200);

    const otherPantry = await request(app.getHttpServer())
      .get('/pantry')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);

    expect(
      asBody<{ ingredientId: string }[]>(otherPantry.body).some(
        (item) => item.ingredientId === ingredientId,
      ),
    ).toBe(false);

    await request(app.getHttpServer())
      .delete(`/pantry/items/${ingredientId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/pantry/items/${ingredientId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);
  });

  it('RNF05: stores password as bcrypt hash in database', async () => {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const user = await userRepo.findOne({ where: { email: ownerEmail } });
    expect(user).toBeTruthy();
    expect(user!.passwordHash).not.toBe('TestPass123!');
    expect(user!.passwordHash.length).toBeGreaterThanOrEqual(60);
    expect(user!.passwordHash.startsWith('$2')).toBe(true);
  });
});
