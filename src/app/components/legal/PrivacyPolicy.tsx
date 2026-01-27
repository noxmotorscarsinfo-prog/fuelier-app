import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-gray-400 mb-8">Última actualización: 13 de enero de 2026</p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Información que Recopilamos</h2>
            <p className="mb-2">Fuelier recopila la siguiente información para proporcionar nuestros servicios:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Información de cuenta:</strong> Email, nombre y contraseña encriptada</li>
              <li><strong>Datos físicos:</strong> Peso, altura, edad, género y nivel de actividad</li>
              <li><strong>Objetivos nutricionales:</strong> Metas de calorías, proteínas, carbohidratos y grasas</li>
              <li><strong>Historial alimenticio:</strong> Comidas registradas y platos personalizados</li>
              <li><strong>Datos de entrenamiento:</strong> Planes de ejercicio y progreso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Cómo Usamos tu Información</h2>
            <p>Utilizamos tus datos exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Calcular tus necesidades nutricionales personalizadas</li>
              <li>Hacer seguimiento de tu progreso</li>
              <li>Personalizar recomendaciones de comidas</li>
              <li>Mejorar nuestros servicios y algoritmos</li>
              <li>Comunicarnos contigo sobre tu cuenta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Almacenamiento y Seguridad</h2>
            <p>
              Tus datos se almacenan de forma segura en servidores de Supabase, protegidos con:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Encriptación SSL/TLS en tránsito</li>
              <li>Encriptación en reposo</li>
              <li>Autenticación JWT segura</li>
              <li>Row Level Security (RLS) en la base de datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Compartición de Datos</h2>
            <p>
              <strong>No vendemos ni compartimos</strong> tu información personal con terceros 
              para fines de marketing. Solo compartimos datos con:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Proveedores de infraestructura (Supabase, Vercel) para operar el servicio</li>
              <li>Autoridades legales cuando sea requerido por ley</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Tus Derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Acceder</strong> a tus datos personales</li>
              <li><strong>Rectificar</strong> información incorrecta</li>
              <li><strong>Eliminar</strong> tu cuenta y todos los datos asociados</li>
              <li><strong>Exportar</strong> tus datos en formato legible</li>
              <li><strong>Revocar</strong> el consentimiento en cualquier momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies</h2>
            <p>
              Fuelier utiliza cookies esenciales para mantener tu sesión activa. 
              No utilizamos cookies de seguimiento ni de publicidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Retención de Datos</h2>
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa. 
              Si eliminas tu cuenta, todos tus datos serán borrados permanentemente 
              en un plazo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Te notificaremos sobre 
              cambios significativos a través del email registrado en tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contacto</h2>
            <p>
              Para cualquier consulta sobre privacidad, contáctanos en:{' '}
              <a href="mailto:privacidad@fuelier.com" className="text-emerald-400 hover:underline">
                privacidad@fuelier.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-700 text-center text-gray-500 text-sm">
          © 2026 Fuelier. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
