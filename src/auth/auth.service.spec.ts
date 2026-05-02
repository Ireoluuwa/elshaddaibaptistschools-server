import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockUsersService = {
    findOneById: jest.fn(),
    findOneByUsername: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return simplified student profile when user exists', async () => {
      const mockUser = {
        id: '1',
        username: 'student1',
        role: 'student',
        studentProfile: {
          firstName: 'John',
          schoolClass: { name: 'SS1' },
          department: { name: 'Science' },
        },
      };

      mockUsersService.findOneById.mockResolvedValue(mockUser);

      const result = await service.getProfile('1');

      expect(result).toEqual({
        id: '1',
        username: 'student1',
        role: 'student',
        firstName: 'John',
        class: 'SS1',
        department: 'Science',
        schoolClass: 'SS1 (Science)',
      });
    });

    it('should return profile without class/dept if they are missing', async () => {
      const mockUser = {
        id: '2',
        username: 'teacher1',
        role: 'teacher',
        teacherProfile: {
          firstName: 'Jane',
          // no class or dept
        },
      };

      mockUsersService.findOneById.mockResolvedValue(mockUser);

      const result = await service.getProfile('2');

      expect(result).toEqual({
        id: '2',
        username: 'teacher1',
        role: 'teacher',
        firstName: 'Jane',
        class: null,
        department: null,
        schoolClass: null,
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      mockUsersService.findOneById.mockResolvedValue(null);

      await expect(service.getProfile('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
