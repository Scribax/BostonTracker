// ==========================================
// AUTH CONTROLLER TESTS
// ==========================================

import { Response } from 'express';
import jwt from 'jsonwebtoken';

import { User } from '@models/index';
import { login, logout, getCurrentUser, getAllUsers, createUser, updateUser, deleteUser } from '@controllers/auth';
import { AuthenticatedRequest, ApiResponse, LoginRequest, CreateUserRequest } from '@types/index';

// Mock dependencies
jest.mock('@models/index');
jest.mock('jsonwebtoken');

// ==========================================
// TEST DATA
// ==========================================

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Admin',
  email: 'admin@test.com',
  employeeId: 'EMP001',
  password: 'hashedpassword123',
  role: 'admin' as const,
  isActive: true,
  lastLogin: new Date(),
  matchPassword: jest.fn(),
  save: jest.fn(),
  toJSON: jest.fn().mockReturnValue({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin',
    isActive: true,
  }),
};

const mockDelivery = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Delivery',
  email: null,
  employeeId: 'DEL001',
  password: 'hashedpassword123',
  role: 'delivery' as const,
  isActive: true,
  matchPassword: jest.fn(),
  save: jest.fn(),
  toJSON: jest.fn().mockReturnValue({
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Delivery',
    role: 'delivery',
    isActive: true,
  }),
};

// ==========================================
// MOCK RESPONSE HELPER
// ==========================================

const mockResponse = (): Response<ApiResponse> & { json: jest.Mock; status: jest.Mock } => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ==========================================
// LOGIN TESTS
// ==========================================

describe('Auth Controller - Login', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    req = {
      body: {} as LoginRequest,
    };
    res = mockResponse();
    jest.clearAllMocks();
  });

  it('should login successfully with valid admin credentials', async () => {
    req.body = {
      email: 'admin@test.com',
      password: 'password123',
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    mockUser.matchPassword.mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

    await login(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Login exitoso',
      data: {
        success: true,
        message: 'Login exitoso',
        token: 'mock-jwt-token',
        user: expect.objectContaining({
          id: mockUser.id,
          name: mockUser.name,
          role: 'admin',
        }),
      },
    });
  });

  it('should login successfully with valid delivery credentials', async () => {
    req.body = {
      employeeId: 'DEL001',
      password: 'password123',
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockDelivery);
    mockDelivery.matchPassword.mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

    await login(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            role: 'delivery',
          }),
        }),
      })
    );
  });

  it('should return 400 when credentials are missing', async () => {
    req.body = { password: 'password123' };

    await login(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Por favor proporciona credenciales válidas',
      error: 'Missing credentials',
    });
  });

  it('should return 401 for invalid credentials', async () => {
    req.body = {
      email: 'admin@test.com',
      password: 'wrongpassword',
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    mockUser.matchPassword.mockResolvedValue(false);

    await login(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Credenciales inválidas',
      error: 'Invalid credentials',
    });
  });

  it('should return 401 for inactive user', async () => {
    req.body = {
      email: 'admin@test.com',
      password: 'password123',
    };

    const inactiveUser = {
      ...mockUser,
      isActive: false,
      matchPassword: jest.fn().mockResolvedValue(true),
    };

    (User.findOne as jest.Mock).mockResolvedValue(inactiveUser);

    await login(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario desactivado',
      error: 'User inactive',
    });
  });

  it('should handle server errors', async () => {
    req.body = {
      email: 'admin@test.com',
      password: 'password123',
    };

    (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

    await login(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error interno del servidor',
      error: expect.any(String),
    });
  });
});

// ==========================================
// GET CURRENT USER TESTS
// ==========================================

describe('Auth Controller - Get Current User', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    req = {
      user: mockUser.toJSON(),
    };
    res = mockResponse();
    jest.clearAllMocks();
  });

  it('should return current user data', async () => {
    await getCurrentUser(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { user: mockUser.toJSON() },
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    req.user = undefined;

    await getCurrentUser(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario no autenticado',
      error: 'Not authenticated',
    });
  });
});

// ==========================================
// CREATE USER TESTS
// ==========================================

describe('Auth Controller - Create User', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    req = {
      body: {} as CreateUserRequest,
      user: mockUser.toJSON(),
    };
    res = mockResponse();
    jest.clearAllMocks();
  });

  it('should create admin user successfully', async () => {
    req.body = {
      name: 'New Admin',
      email: 'newadmin@test.com',
      password: 'password123',
      role: 'admin',
    };

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue({
      ...mockUser,
      name: 'New Admin',
      email: 'newadmin@test.com',
      toJSON: jest.fn().mockReturnValue({
        id: 'new-id',
        name: 'New Admin',
        email: 'newadmin@test.com',
        role: 'admin',
      }),
    });

    await createUser(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Usuario creado exitosamente',
      data: expect.objectContaining({
        user: expect.objectContaining({
          name: 'New Admin',
          role: 'admin',
        }),
      }),
    });
  });

  it('should create delivery user successfully', async () => {
    req.body = {
      name: 'New Delivery',
      employeeId: 'NEW001',
      password: 'password123',
      role: 'delivery',
    };

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue({
      ...mockDelivery,
      name: 'New Delivery',
      employeeId: 'NEW001',
      toJSON: jest.fn().mockReturnValue({
        id: 'new-delivery-id',
        name: 'New Delivery',
        employeeId: 'NEW001',
        role: 'delivery',
      }),
    });

    await createUser(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            role: 'delivery',
          }),
        }),
      })
    );
  });

  it('should return 400 when required fields are missing', async () => {
    req.body = {
      name: 'New User',
      // Missing password and role
    };

    await createUser(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Nombre, contraseña y rol son requeridos',
      error: 'Missing required fields',
    });
  });

  it('should return 400 when email already exists', async () => {
    req.body = {
      name: 'New Admin',
      email: 'existing@test.com',
      password: 'password123',
      role: 'admin',
    };

    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    await createUser(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email ya existe',
      error: 'Email already exists',
    });
  });

  it('should return 400 when employeeId already exists', async () => {
    req.body = {
      name: 'New Delivery',
      employeeId: 'DEL001',
      password: 'password123',
      role: 'delivery',
    };

    (User.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // Email check
      .mockResolvedValueOnce(mockDelivery); // EmployeeId check

    await createUser(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'ID de empleado ya existe',
      error: 'EmployeeId already exists',
    });
  });
});

// ==========================================
// LOGOUT TESTS
// ==========================================

describe('Auth Controller - Logout', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    req = {};
    res = mockResponse();
    jest.clearAllMocks();
  });

  it('should logout successfully', async () => {
    await logout(req as AuthenticatedRequest, res as unknown as Response<ApiResponse>);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  });
});
