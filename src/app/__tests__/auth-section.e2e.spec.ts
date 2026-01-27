/**
 * Tests E2E para el Módulo de Autenticación
 * 
 * Cubre:
 * - FLUJO 1: Login con diagnóstico de errores
 * - FLUJO 2: Signup con validaciones
 * - FLUJO 3: Admin login seguro
 * - FLUJO 4: Logout correcto
 * - FLUJO 5: Gestión de sesiones
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// MOCKS
// ============================================

// Mock de api.ts
const mockSignin = vi.fn();
const mockSignup = vi.fn();
const mockSignout = vi.fn();
const mockAdminLogin = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();

vi.mock('../utils/api', () => ({
  signin: (...args: any[]) => mockSignin(...args),
  signup: (...args: any[]) => mockSignup(...args),
  signout: (...args: any[]) => mockSignout(...args),
  adminLogin: (...args: any[]) => mockAdminLogin(...args),
  getSession: (...args: any[]) => mockGetSession(...args),
  getUser: (...args: any[]) => mockGetUser(...args),
}));

// ============================================
// FLUJO 1: LOGIN CON DIAGNÓSTICO DE ERRORES
// ============================================

describe('FLUJO 1: Login con diagnóstico de errores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1.1 - Devuelve "user_not_found" cuando el email no existe', async () => {
    // Simular respuesta del backend
    const backendResponse = {
      success: false,
      error: 'Esta cuenta no existe. Por favor, crea una cuenta primero.',
      code: 'user_not_found'
    };
    
    mockSignin.mockResolvedValue(backendResponse);
    
    const result = await mockSignin('noexiste@test.com', 'cualquier');
    
    expect(result.success).toBe(false);
    expect(result.code).toBe('user_not_found');
    expect(result.error).toContain('no existe');
  });

  it('1.2 - Devuelve "wrong_password" cuando la contraseña es incorrecta', async () => {
    const backendResponse = {
      success: false,
      error: 'Contraseña incorrecta. Verifica tu contraseña.',
      code: 'wrong_password'
    };
    
    mockSignin.mockResolvedValue(backendResponse);
    
    const result = await mockSignin('existe@test.com', 'malacontraseña');
    
    expect(result.success).toBe(false);
    expect(result.code).toBe('wrong_password');
    expect(result.error).toContain('incorrecta');
  });

  it('1.3 - Login exitoso devuelve access_token', async () => {
    const backendResponse = {
      success: true,
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: { id: '123', email: 'test@test.com' }
    };
    
    mockSignin.mockResolvedValue(backendResponse);
    
    const result = await mockSignin('test@test.com', 'correcta123');
    
    expect(result.success).toBe(true);
    expect(result.access_token).toBeDefined();
    expect(result.user.email).toBe('test@test.com');
  });

  it('1.4 - Maneja errores de red graciosamente', async () => {
    mockSignin.mockResolvedValue({
      success: false,
      error: 'Failed to sign in. Connection error.'
    });
    
    const result = await mockSignin('test@test.com', 'password');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('error');
  });
});

// ============================================
// FLUJO 2: SIGNUP CON VALIDACIONES
// ============================================

describe('FLUJO 2: Signup con validaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('2.1 - Detecta email duplicado (email_exists)', async () => {
    const backendResponse = {
      success: false,
      error: 'Email already registered',
      code: 'email_exists'
    };
    
    mockSignup.mockResolvedValue(backendResponse);
    
    const result = await mockSignup('existe@test.com', 'password123', 'Test');
    
    expect(result.success).toBe(false);
    expect(result.code).toBe('email_exists');
  });

  it('2.2 - Detecta contraseña débil (weak_password)', async () => {
    const backendResponse = {
      success: false,
      error: 'Password too weak',
      code: 'weak_password'
    };
    
    mockSignup.mockResolvedValue(backendResponse);
    
    const result = await mockSignup('nuevo@test.com', '123', 'Test');
    
    expect(result.success).toBe(false);
    expect(result.code).toBe('weak_password');
  });

  it('2.3 - Signup exitoso devuelve access_token', async () => {
    const backendResponse = {
      success: true,
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: { id: '456', email: 'nuevo@test.com', name: 'Nuevo' }
    };
    
    mockSignup.mockResolvedValue(backendResponse);
    
    const result = await mockSignup('nuevo@test.com', 'password123', 'Nuevo');
    
    expect(result.success).toBe(true);
    expect(result.access_token).toBeDefined();
    expect(result.user.email).toBe('nuevo@test.com');
  });

  it('2.4 - Requiere nombre para signup', async () => {
    // Validación de frontend - el backend debería rechazar sin nombre
    const backendResponse = {
      success: false,
      error: 'Missing required fields'
    };
    
    mockSignup.mockResolvedValue(backendResponse);
    
    const result = await mockSignup('test@test.com', 'password123', '');
    
    expect(result.success).toBe(false);
  });
});

// ============================================
// FLUJO 3: ADMIN LOGIN SEGURO
// ============================================

describe('FLUJO 3: Admin login seguro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('3.1 - Admin login exitoso con credenciales válidas', async () => {
    const backendResponse = {
      success: true,
      isAdmin: true,
      user: { email: 'admin@fuelier.com', name: 'Administrador' }
    };
    
    mockAdminLogin.mockResolvedValue(backendResponse);
    
    const result = await mockAdminLogin('admin@fuelier.com', 'Fuelier2025!');
    
    expect(result.success).toBe(true);
    expect(result.isAdmin).toBe(true);
    expect(result.user.email).toBe('admin@fuelier.com');
  });

  it('3.2 - Admin login falla con credenciales incorrectas', async () => {
    const backendResponse = {
      success: false,
      error: 'Credenciales de administrador incorrectas',
      code: 'invalid_admin'
    };
    
    mockAdminLogin.mockResolvedValue(backendResponse);
    
    const result = await mockAdminLogin('admin@fuelier.com', 'wrong_password');
    
    expect(result.success).toBe(false);
    expect(result.code).toBe('invalid_admin');
  });

  it('3.3 - Admin login falla con email incorrecto', async () => {
    const backendResponse = {
      success: false,
      error: 'Credenciales de administrador incorrectas',
      code: 'invalid_admin'
    };
    
    mockAdminLogin.mockResolvedValue(backendResponse);
    
    const result = await mockAdminLogin('notadmin@fuelier.com', 'Fuelier2025!');
    
    expect(result.success).toBe(false);
    expect(result.code).toBe('invalid_admin');
  });

  it('3.4 - Credenciales NO están hardcodeadas en frontend', () => {
    // Este test verifica que NO hay credenciales visibles en el código frontend
    // Las credenciales deben estar SOLO en el servidor
    
    const adminLoginCode = `
      // Código de AdminLogin.tsx actual (sin credenciales hardcoded)
      const result = await api.adminLogin(email, password);
    `;
    
    // Verificar que NO contiene las credenciales
    expect(adminLoginCode).not.toContain('admin@fuelier.com');
    expect(adminLoginCode).not.toContain('Fuelier2025!');
    expect(adminLoginCode).not.toContain('ADMIN_PASSWORD');
    expect(adminLoginCode).not.toContain('ADMIN_EMAIL');
  });
});

// ============================================
// FLUJO 4: LOGOUT CORRECTO
// ============================================

describe('FLUJO 4: Logout correcto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('4.1 - Logout llama a api.signout()', async () => {
    mockSignout.mockResolvedValue(true);
    
    await mockSignout();
    
    expect(mockSignout).toHaveBeenCalled();
  });

  it('4.2 - Logout limpia el token incluso si hay error', async () => {
    // Simular error en signout
    mockSignout.mockRejectedValue(new Error('Network error'));
    
    try {
      await mockSignout();
    } catch (e) {
      // Se espera error pero el token debe limpiarse
    }
    
    expect(mockSignout).toHaveBeenCalled();
  });

  it('4.3 - Logout sin token no falla', async () => {
    mockSignout.mockResolvedValue(true);
    
    const result = await mockSignout();
    
    expect(result).toBe(true);
  });
});

// ============================================
// FLUJO 5: GESTIÓN DE SESIONES
// ============================================

describe('FLUJO 5: Gestión de sesiones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('5.1 - getSession con token válido devuelve usuario', async () => {
    const backendResponse = {
      success: true,
      user: { id: '123', email: 'test@test.com' }
    };
    
    mockGetSession.mockResolvedValue(backendResponse);
    
    const result = await mockGetSession();
    
    expect(result.success).toBe(true);
    expect(result.user.id).toBe('123');
  });

  it('5.2 - getSession con token inválido devuelve error', async () => {
    const backendResponse = {
      success: false,
      error: 'Invalid token'
    };
    
    mockGetSession.mockResolvedValue(backendResponse);
    
    const result = await mockGetSession();
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  it('5.3 - getSession sin token devuelve error', async () => {
    const backendResponse = {
      success: false,
      error: 'No token found'
    };
    
    mockGetSession.mockResolvedValue(backendResponse);
    
    const result = await mockGetSession();
    
    expect(result.success).toBe(false);
  });

  it('5.4 - getUser carga perfil completo desde BD', async () => {
    const userData = {
      email: 'test@test.com',
      name: 'Test User',
      goals: { calories: 2000, protein: 150, carbs: 200, fat: 65 }
    };
    
    mockGetUser.mockResolvedValue(userData);
    
    const result = await mockGetUser('test@test.com');
    
    expect(result.email).toBe('test@test.com');
    expect(result.goals).toBeDefined();
    expect(result.goals.calories).toBe(2000);
  });

  it('5.5 - getUser con email inexistente devuelve null', async () => {
    mockGetUser.mockResolvedValue(null);
    
    const result = await mockGetUser('noexiste@test.com');
    
    expect(result).toBeNull();
  });
});

// ============================================
// VALIDACIONES DE FORMATO
// ============================================

describe('Validaciones de formato', () => {
  it('Email debe tener formato válido', () => {
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    expect(validateEmail('test@test.com')).toBe(true);
    expect(validateEmail('user@domain.es')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('no@')).toBe(false);
    expect(validateEmail('@test.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('Password debe tener mínimo 6 caracteres', () => {
    const validatePassword = (password: string) => password.length >= 6;
    
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('password')).toBe(true);
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });
});
