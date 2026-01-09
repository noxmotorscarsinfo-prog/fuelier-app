import { useState } from 'react';
import { User, LogIn, Mail, UserPlus, Fuel, Trash2, Shield, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string, name: string) => void;
  onSignup: (email: string, password: string, name: string) => void;
  onAdminAccess?: () => void;
}

export default function Login({ onLogin, onSignup, onAdminAccess }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !validateEmail(email)) {
      setError('Por favor, introduce un email válido');
      return;
    }

    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (isSignup && !name) {
      setError('Por favor, introduce tu nombre');
      return;
    }

    if (isSignup) {
      onSignup(email, password, name);
    } else {
      onLogin(email, password, name || 'Usuario');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center p-6 relative">
      {/* Botón Admin - Esquina inferior izquierda */}
      {onAdminAccess && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔐 Admin button clicked!');
            onAdminAccess();
          }}
          className="fixed bottom-6 left-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all shadow-lg group z-50 cursor-pointer"
          title="Acceso administrador"
          type="button"
        >
          <Shield className="w-5 h-5 pointer-events-none" />
          <span className="absolute left-14 bottom-3 bg-neutral-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Admin
          </span>
        </button>
      )}

      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Fuel className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl text-white mb-2">Fuelier</h1>
          <p className="text-emerald-100">Gestiona tus macros de forma inteligente</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl text-neutral-800 mb-2">
              {isSignup ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <p className="text-sm text-neutral-500">
              {isSignup 
                ? 'Configura tus objetivos personalizados' 
                : 'Accede a tu cuenta existente'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-4 rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSignup ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Crear cuenta</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              {isSignup 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-emerald-50 text-sm">
          <p>✅ Todos tus datos se guardan en la nube con Supabase</p>
        </div>
      </div>
    </div>
  );
}