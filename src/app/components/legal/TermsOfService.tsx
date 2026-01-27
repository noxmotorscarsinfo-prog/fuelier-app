import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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

        <h1 className="text-3xl font-bold mb-2">Términos de Uso</h1>
        <p className="text-gray-400 mb-8">Última actualización: 13 de enero de 2026</p>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar Fuelier, aceptas estos términos de uso en su totalidad. 
              Si no estás de acuerdo con alguna parte de estos términos, no debes usar la aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h2>
            <p>
              Fuelier es una aplicación de gestión nutricional que te ayuda a:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Calcular tus necesidades calóricas y de macronutrientes</li>
              <li>Registrar y seguir tu alimentación diaria</li>
              <li>Crear y gestionar platos personalizados</li>
              <li>Planificar entrenamientos</li>
              <li>Hacer seguimiento de tu progreso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Cuenta de Usuario</h2>
            <p className="mb-2">Al crear una cuenta, te comprometes a:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Proporcionar información veraz y actualizada</li>
              <li>Mantener la confidencialidad de tu contraseña</li>
              <li>No compartir tu cuenta con terceros</li>
              <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Uso Aceptable</h2>
            <p className="mb-2">No está permitido:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Usar la aplicación para fines ilegales</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
              <li>Interferir con el funcionamiento del servicio</li>
              <li>Enviar contenido malicioso o spam</li>
              <li>Realizar ingeniería inversa del software</li>
              <li>Usar bots o sistemas automatizados sin autorización</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de Fuelier (código, diseño, textos, logotipos, base de datos 
              de ingredientes) es propiedad de Fuelier o sus licenciantes y está protegido 
              por leyes de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contenido del Usuario</h2>
            <p>
              Conservas la propiedad de los datos que introduces en Fuelier (platos personalizados, 
              registros). Nos otorgas licencia para almacenar y procesar estos datos con el 
              único fin de proporcionarte el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Aviso Médico</h2>
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
              <p className="font-medium text-yellow-400 mb-2">⚠️ Importante</p>
              <p>
                Fuelier <strong>NO es un sustituto del consejo médico profesional</strong>. 
                Las recomendaciones nutricionales son orientativas. Antes de iniciar cualquier 
                dieta o programa de ejercicio, consulta con un profesional de la salud, 
                especialmente si tienes condiciones médicas preexistentes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitación de Responsabilidad</h2>
            <p>
              Fuelier se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Decisiones tomadas basándose en la información de la app</li>
              <li>Pérdida de datos por causas ajenas a nuestro control</li>
              <li>Interrupciones temporales del servicio</li>
              <li>Resultados de salud derivados del uso de la aplicación</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Modificaciones del Servicio</h2>
            <p>
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier 
              aspecto del servicio en cualquier momento, con o sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Terminación</h2>
            <p>
              Podemos suspender o cancelar tu cuenta si violas estos términos. 
              Puedes eliminar tu cuenta en cualquier momento desde la configuración.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Ley Aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de España. Cualquier disputa será 
              sometida a los tribunales de Barcelona.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contacto</h2>
            <p>
              Para consultas sobre estos términos:{' '}
              <a href="mailto:legal@fuelier.com" className="text-emerald-400 hover:underline">
                legal@fuelier.com
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
