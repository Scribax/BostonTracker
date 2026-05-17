// ==========================================
// AUTH MIDDLEWARE TESTS
// ==========================================

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { authenticate, authorize, authorizeOwnership } from '@middleware/auth';
import { User } from '@models/index';
import { AuthenticatedRequest, ApiResponse } from '@types/index';

// Mock dependencies
jest.mock('@models/index');
jest.mock('jsonwebtoken');

// ==========================================
// MOCK DATA
// ==========================================

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test User',
  role: 'admin',
  isActive: true,
};

const mockResponse = (): Response<ApiResponse> & { json: jest.Mock; status: jest.Mock } => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

// ==========================================
// AUTHENTICATE TESTS
// ==========================================

describe('Auth Middleware - authenticate', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = mockResponse();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', async () => {
    req.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue({ id: mockUser.id });
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    await authenticate(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(req.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when no token provided', async () => {
    req.headers = {};

    await authenticate(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autorizado, token requerido',
      error: 'Token not provided',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token format', async () => {
    req.headers = {
      authorization: 'InvalidFormat token',
    };

    await authenticate(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for expired/invalid token', async () => {
    req.headers = {
      authorization: 'Bearer invalid-token',
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authenticate(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token no válido',
      error: 'Invalid token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when user not found', async () => {
    req.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue({ id: 'non-existent-id' });
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    await authenticate(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token no válido, usuario no encontrado',
      error: 'User not found',
    });
  });

  it('should return 401 for inactive user', async () => {
    req.headers = {
      authorization: 'Bearer valid-token',
    };

    const inactiveUser = { ...mockUser, isActive: false };
    (jwt.verify as jest.Mock).mockReturnValue({ id: inactiveUser.id });
    (User.findByPk as jest.Mock).mockResolvedValue(inactiveUser);

    await authenticate(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario desactivado',
      error: 'User inactive',
    });
  });
});

// ==========================================
// AUTHORIZE TESTS
// ==========================================

describe('Auth Middleware - authorize', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    req = {
      user: mockUser as any,
    };
    res = mockResponse();
    jest.clearAllMocks();
  });

  it('should allow access for authorized role', () => {
    const authorizeMiddleware = authorize('admin');
    authorizeMiddleware(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should deny access for unauthorized role', () => {
    req.user = { ...mockUser, role: 'delivery' } as any;
    
    const authorizeMiddleware = authorize('admin');
    authorizeMiddleware(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Acceso denegado. Permisos insuficientes',
      error: 'Insufficient permissions',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when user not authenticated', () => {
    req.user = undefined;
    
    const authorizeMiddleware = authorize('admin');
    authorizeMiddleware(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autorizado',
      error: 'User not authenticated',
    });
  });

  it('should allow multiple roles', () => {
    req.user = { ...mockUser, role: 'delivery' } as any;
    
    const authorizeMiddleware = authorize('admin', 'delivery');
    authorizeMiddleware(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ==========================================
// AUTHORIZE OWNERSHIP TESTS
// ==========================================

describe('Auth Middleware - authorizeOwnership', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    req = {
      user: { ...mockUser, id: 'user-123', role: 'delivery' } as any,
      params: { id: 'user-123' },
    };
    res = mockResponse();
    jest.clearAllMocks();
  });

  it('should allow access for admin', async () => {
    req.user = { ...mockUser, role: 'admin' } as any;

    await authorizeOwnership(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should allow access for resource owner', async () => {
    await authorizeOwnership(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should deny access for non-owner delivery', async () => {
    req.params = { id: 'different-user-id' };

    await authorizeOwnership(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Acceso denegado. No puedes acceder a recursos de otro usuario',
      error: 'Not authorized for this resource',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when user not authenticated', async () => {
    req.user = undefined;

    await authorizeOwnership(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autorizado',
      error: 'User not authenticated',
    });
  });
});
