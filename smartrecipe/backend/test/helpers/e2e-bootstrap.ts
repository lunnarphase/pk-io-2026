import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { asBody, AuthTokensResponse } from './e2e-types';

export async function createE2eApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

export async function closeE2eApp(
  app: INestApplication<App> | undefined,
): Promise<void> {
  if (app) await app.close();
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

export async function registerUser(
  app: INestApplication<App>,
  email: string,
  password = 'TestPass123!',
): Promise<void> {
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password })
    .expect(201);
}

export async function loginUser(
  app: INestApplication<App>,
  email: string,
  password = 'TestPass123!',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  return asBody<AuthTokensResponse>(res.body).accessToken;
}

export async function registerAndLogin(
  app: INestApplication<App>,
  prefix: string,
): Promise<{ email: string; token: string }> {
  const email = uniqueEmail(prefix);
  await registerUser(app, email);
  const token = await loginUser(app, email);
  return { email, token };
}
