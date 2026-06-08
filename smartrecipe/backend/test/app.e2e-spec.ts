import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { closeE2eApp, createE2eApp } from './helpers/e2e-bootstrap';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  }, 30_000);

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('rejects unauthenticated access to protected routes', async () => {
    await request(app.getHttpServer()).get('/recipes').expect(401);
  });
});
