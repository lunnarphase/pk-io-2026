import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  passwordHash: '',
};

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string, def?: unknown) => {
    const map: Record<string, unknown> = {
      JWT_ACCESS_TTL: '900',
      JWT_REFRESH_TTL: '604800',
    };
    return map[key] ?? def;
  }),
  getOrThrow: jest.fn().mockReturnValue('refresh-secret'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  // ── register ──────────────────────────────────────────────────────────
  describe('register', () => {
    it('creates a user and returns tokens', async () => {
      mockUsersService.create.mockResolvedValue({
        id: 'uuid',
        email: 'a@b.com',
      });
      const result = await service.register('a@b.com', 'secret123');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        'a@b.com',
        expect.any(String),
      );
      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });

    it('hashes the password before storing (not plain-text)', async () => {
      mockUsersService.create.mockResolvedValue({
        id: 'uuid',
        email: 'a@b.com',
      });
      await service.register('a@b.com', 'mysecret');
      const [[, hash]] = mockUsersService.create.mock.calls as [
        [string, string],
      ];
      expect(hash).not.toBe('mysecret');
      const valid = await bcrypt.compare('mysecret', hash);
      expect(valid).toBe(true);
    });

    it('propagates ConflictException from UsersService', async () => {
      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email already in use'),
      );
      await expect(
        service.register('dup@b.com', 'pass1234'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // ── login ─────────────────────────────────────────────────────────────
  describe('login', () => {
    beforeEach(async () => {
      mockUser.passwordHash = await bcrypt.hash('correct-pass', 12);
    });

    it('returns tokens for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      const result = await service.login('test@example.com', 'correct-pass');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException for unknown email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login('no@one.com', 'pass')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      await expect(
        service.login('test@example.com', 'wrong-pass'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────
  describe('refresh', () => {
    it('issues new tokens for a valid refresh token', () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-uuid',
        email: 'test@example.com',
      });
      const result = service.refresh('valid-refresh-token');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException when refresh token is invalid', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      expect(() => service.refresh('bad-token')).toThrow(UnauthorizedException);
    });
  });
});
