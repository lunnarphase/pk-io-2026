import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../domain/entities/user.entity';

const USER_ID = 'user-uuid';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: USER_ID,
    email: 'user@example.com',
    passwordHash: '$2b$12$hashedpasswordvaluewithsufficientlength',
    ...overrides,
  }) as User;

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn((dto: Partial<User>) => ({ ...dto }) as User),
  save: jest.fn((user: User) => Promise.resolve(user)),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findByEmail', () => {
    it('returns user when email exists', async () => {
      mockRepo.findOne.mockResolvedValue(makeUser());
      const user = await service.findByEmail('user@example.com');
      expect(user?.email).toBe('user@example.com');
    });
  });

  describe('findById', () => {
    it('returns user when id exists', async () => {
      mockRepo.findOne.mockResolvedValue(makeUser());
      const user = await service.findById(USER_ID);
      expect(user?.id).toBe(USER_ID);
    });
  });

  describe('create', () => {
    it('throws ConflictException when email already exists', async () => {
      mockRepo.findOne.mockResolvedValue(makeUser());
      await expect(
        service.create('user@example.com', 'hash'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates and saves a new user', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(makeUser());
      const user = await service.create('new@example.com', 'hash');
      expect(mockRepo.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        passwordHash: 'hash',
      });
      expect(user.email).toBe('user@example.com');
    });
  });
});
