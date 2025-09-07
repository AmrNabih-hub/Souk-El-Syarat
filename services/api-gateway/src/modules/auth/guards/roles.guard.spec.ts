import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      // Arrange
      const context = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      // Arrange
      const context = createMockExecutionContext({
        user: { role: 'admin' }
      });
      mockReflector.getAllAndOverride.mockReturnValue(['admin', 'vendor']);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      // Arrange
      const context = createMockExecutionContext({
        user: null
      });
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      // Arrange
      const context = createMockExecutionContext({
        user: { role: 'customer' }
      });
      mockReflector.getAllAndOverride.mockReturnValue(['admin', 'vendor']);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with correct error message', () => {
      // Arrange
      const context = createMockExecutionContext({
        user: { role: 'customer' }
      });
      mockReflector.getAllAndOverride.mockReturnValue(['admin', 'vendor']);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied. Required roles: admin, vendor. User role: customer'
      );
    });
  });

  function createMockExecutionContext(user?: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  }
});