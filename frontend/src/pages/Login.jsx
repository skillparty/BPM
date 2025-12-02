import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      await login(username, password);
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error en login:', error);
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        {/* Contenido centrado */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 xl:px-20">
          {/* Video grande centrado */}
          <div className="mb-10">
            <video 
              src="/video_logo.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-56 h-56 xl:w-72 xl:h-72 rounded-3xl shadow-2xl object-cover"
            />
          </div>
          
          {/* Texto centrado */}
          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3 text-center leading-tight">
            Sistema de Gestión Empresarial
          </h1>
          <p className="text-primary-100 text-center max-w-sm">
            Administra tus pedidos, clientes e inventario de manera eficiente.
          </p>
          
          {/* Features centrados */}
          <div className="mt-10 space-y-3">
            <div className="flex items-center justify-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-sm">Control de pedidos en tiempo real</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-sm">Gestión de clientes y proveedores</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-white/90">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-sm">Reportes y estadísticas detalladas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <video 
              src="/video_logo.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-20 h-20 rounded-xl shadow-lg mx-auto mb-4 object-cover"
            />
            <h1 className="text-2xl font-bold text-slate-900">BPM System</h1>
          </div>

          {/* Card del formulario */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Bienvenido
              </h2>
              <p className="text-slate-500 mt-1">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo Usuario */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="Ingresa tu usuario"
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={1.75} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              {/* Recordarme */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-sm text-slate-600">Recordarme</span>
                </label>
                <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-5 h-5" strokeWidth={2} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 space-y-3">
            <p className="text-center text-sm text-slate-400">
              &copy; 2025 BPM System. Todos los derechos reservados.
            </p>
            
            {/* Tech stack icons */}
            <div className="flex items-center justify-center space-x-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">Tecnologías:</span>
              <div className="flex items-center space-x-2">
                {/* React */}
                <div className="group relative">
                  <svg className="w-5 h-5 text-slate-400 hover:text-[#61DAFB] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 9.861a2.139 2.139 0 100 4.278 2.139 2.139 0 000-4.278zm-5.992 6.394l-.472-.12C2.018 15.246 0 13.737 0 11.996s2.018-3.25 5.536-4.139l.472-.119.133.468a23.53 23.53 0 001.363 3.578l.101.213-.101.213a23.307 23.307 0 00-1.363 3.578l-.133.467zM5.317 8.95c-2.674.751-4.315 1.9-4.315 3.046 0 1.145 1.641 2.294 4.315 3.046a24.95 24.95 0 011.182-3.046 24.752 24.752 0 01-1.182-3.046zm13.675 7.305l-.133-.469a23.357 23.357 0 00-1.364-3.577l-.101-.213.101-.213a23.42 23.42 0 001.364-3.578l.133-.468.473.119c3.517.889 5.535 2.398 5.535 4.14s-2.018 3.25-5.535 4.139l-.473.12zm-.491-4.259c.48 1.039.877 2.06 1.182 3.046 2.675-.752 4.315-1.901 4.315-3.046 0-1.146-1.641-2.294-4.315-3.046a24.788 24.788 0 01-1.182 3.046zM5.31 8.945l-.133-.467C4.188 4.992 4.488 2.494 6 1.622c1.483-.856 3.864.155 6.359 2.716l.34.349-.34.349a23.552 23.552 0 00-2.422 2.967l-.135.193-.235.02a23.657 23.657 0 00-3.785.61l-.472.119zm1.896-6.63c-.268 0-.505.058-.705.173-.994.573-1.17 2.565-.485 5.253a25.122 25.122 0 013.233-.501 24.847 24.847 0 012.052-2.544c-1.56-1.519-3.037-2.381-4.095-2.381zm9.589 20.362c-.001 0-.001 0 0 0-1.425 0-3.255-1.073-5.154-3.023l-.34-.349.34-.349a23.53 23.53 0 002.421-2.968l.135-.193.234-.02a23.63 23.63 0 003.787-.609l.472-.119.134.468c.987 3.484.688 5.983-.824 6.854a2.38 2.38 0 01-1.205.308zm-4.096-3.381c1.56 1.519 3.037 2.381 4.095 2.381h.001c.267 0 .505-.058.704-.173.994-.573 1.171-2.566.485-5.254a25.02 25.02 0 01-3.234.501 24.674 24.674 0 01-2.051 2.545zM18.69 8.945l-.472-.119a23.479 23.479 0 00-3.787-.61l-.234-.02-.135-.193a23.414 23.414 0 00-2.421-2.967l-.34-.349.34-.349C14.135 1.778 16.515.767 18 1.622c1.512.872 1.812 3.37.824 6.855l-.134.468zM14.75 7.24c1.142.104 2.227.273 3.234.501.686-2.688.509-4.68-.485-5.253-.988-.571-2.845.304-4.8 2.208A24.849 24.849 0 0114.75 7.24zM7.206 22.677A2.38 2.38 0 016 22.369c-1.512-.871-1.812-3.369-.823-6.854l.132-.468.472.119c1.155.291 2.429.496 3.785.609l.235.02.134.193a23.596 23.596 0 002.422 2.968l.34.349-.34.349c-1.898 1.95-3.728 3.023-5.151 3.023zm-1.19-6.427c-.686 2.688-.509 4.681.485 5.254.987.563 2.843-.305 4.8-2.208a24.998 24.998 0 01-2.052-2.545 24.976 24.976 0 01-3.233-.501zm5.984.628c-.823 0-1.669-.036-2.516-.106l-.235-.02-.135-.193a30.388 30.388 0 01-1.35-2.122 30.354 30.354 0 01-1.166-2.228l-.1-.213.1-.213a30.3 30.3 0 011.166-2.228c.414-.716.869-1.43 1.35-2.122l.135-.193.235-.02a29.785 29.785 0 015.033 0l.234.02.134.193a30.006 30.006 0 012.517 4.35l.101.213-.101.213a29.6 29.6 0 01-2.517 4.35l-.134.193-.234.02c-.847.07-1.694.106-2.517.106zm-2.197-1.084c1.48.111 2.914.111 4.395 0a29.006 29.006 0 002.196-3.798 28.585 28.585 0 00-2.197-3.798 29.031 29.031 0 00-4.394 0 28.477 28.477 0 00-2.197 3.798 29.114 29.114 0 002.197 3.798z"/>
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">React</span>
                </div>
                {/* Node.js */}
                <div className="group relative">
                  <svg className="w-5 h-5 text-slate-400 hover:text-[#339933] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339a.29.29 0 00.272 0l8.795-5.076a.277.277 0 00.134-.238V6.921a.283.283 0 00-.137-.242l-8.791-5.072a.278.278 0 00-.271 0L3.075 6.68a.284.284 0 00-.139.241v10.15a.27.27 0 00.139.235l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675a1.857 1.857 0 01-.922-1.604V6.921c0-.659.353-1.275.922-1.603L11.075.242a1.932 1.932 0 011.848 0l8.794 5.076c.57.329.924.944.924 1.603v10.15a1.86 1.86 0 01-.924 1.604l-8.794 5.078c-.28.163-.6.247-.925.247zm2.715-6.997c-3.857 0-4.664-1.77-4.664-3.257 0-.14.114-.254.256-.254h1.136c.127 0 .233.092.253.216.172 1.161.686 1.746 3.019 1.746 1.858 0 2.649-.42 2.649-1.404 0-.566-.223-.986-3.111-1.269-2.413-.237-3.907-.772-3.907-2.703 0-1.781 1.502-2.843 4.019-2.843 2.828 0 4.225.981 4.402 3.085a.26.26 0 01-.067.19.254.254 0 01-.183.08h-1.143a.252.252 0 01-.246-.196c-.273-1.213-.937-1.601-2.763-1.601-2.035 0-2.272.709-2.272 1.241 0 .644.28.832 3.013 1.196 2.708.361 4.006.872 4.006 2.761 0 1.924-1.603 3.024-4.397 3.024z"/>
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Node.js</span>
                </div>
                {/* PostgreSQL */}
                <div className="group relative">
                  <svg className="w-5 h-5 text-slate-400 hover:text-[#4169E1] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.56 14.95c-.26-.69-1.27-.93-2.05-.79-.51.1-.85.26-1.07.43.15-.51.2-1.06.12-1.61-.18-1.09-.76-2.1-1.68-2.92-.71-.63-1.37-1.09-1.87-1.56.09-.36.15-.73.17-1.11.04-.67-.08-1.27-.37-1.77-.23-.41-.58-.79-1.02-1.11l-.08-.05c-.45-.32-.93-.57-1.4-.75-.74-.29-1.57-.31-2.41-.07-.73.21-1.42.59-2.02 1.11-.08-.08-.17-.16-.26-.24-.59-.51-1.35-.87-2.19-1.05-.75-.16-1.42-.12-1.94.06-.81.27-1.49.8-1.98 1.55-.39.59-.62 1.26-.68 1.98-.04.44-.03.88.03 1.33-.51.47-1.07.94-1.57 1.45-.81.83-1.37 1.82-1.57 2.87-.12.62-.12 1.25-.02 1.89-.4.34-.72.73-.95 1.16-.39.73-.51 1.51-.35 2.29.2.99.8 1.89 1.7 2.56.85.63 1.92 1.05 3.1 1.22-.02.05-.04.1-.06.15-.14.43-.22.86-.22 1.27 0 .93.31 1.79.88 2.49l.06.07c.69.79 1.61 1.18 2.66 1.16.92-.02 1.95-.33 2.97-.98.35.17.72.31 1.1.43 1.43.45 2.95.44 4.17-.14.67-.32 1.25-.78 1.7-1.36.45.15.95.21 1.47.17 1.31-.1 2.58-.69 3.43-1.56.53-.54.89-1.12 1.06-1.7.11-.39.14-.73.14-.99 0-.61-.2-1.23-.54-1.66-.19-.24-.39-.42-.55-.56.63-.57 1.03-1.38 1.09-2.19.04-.54-.06-1.01-.28-1.57zm-6.95-7.48c.38.08.67.44.67.86 0 .1-.02.2-.05.28-.18-.11-.36-.21-.55-.31-.22-.11-.41-.18-.6-.25.04-.19.11-.35.22-.46.1-.11.21-.15.31-.12zm-2.61-.67c-.09-.25-.11-.54-.05-.8.09-.38.36-.63.67-.63.31 0 .58.25.67.63.02.07.03.16.04.24-.32.04-.64.15-.96.32-.13.06-.26.14-.38.23l.01.01zm-2.01.14c-.06-.49.14-.96.51-1.17.13-.07.26-.11.39-.11.15 0 .3.04.43.13.22.14.38.38.45.67.04.17.05.37.02.57-.14-.04-.28-.07-.43-.1-.42-.07-.83-.06-1.16.02-.08-.01-.15-.01-.21-.01zm-4.48 2.14c.25-.22.48-.41.7-.58.38-.3.69-.5.94-.61.31-.14.57-.17.79-.1.24.08.45.28.6.56.12.22.18.48.18.76 0 .29-.07.6-.19.9-.08.21-.18.38-.3.5-.11.12-.23.18-.35.18-.11 0-.23-.06-.35-.15-.13-.11-.26-.26-.38-.44-.11-.17-.22-.37-.33-.58-.27-.52-.49-.72-.62-.71-.16 0-.27.31-.27.31-.02.05-.27.66-.41.87-.15.22-.31.33-.48.33-.2 0-.41-.17-.6-.49-.18-.3-.28-.65-.26-1 .02-.36.16-.67.33-.75zm-.33 7.7c-.64-.47-.98-1.07-1.07-1.78-.06-.53.06-1.09.35-1.64.29-.55.72-1.02 1.24-1.35.16-.1.33-.18.49-.23.02.14.05.27.1.4.18.61.55 1.09 1.04 1.38-.22.46-.38.94-.48 1.44-.11.53-.13 1.07-.07 1.61-.59-.28-1.14-.67-1.6-1.13.02.48.11.95.28 1.39-.1-.03-.19-.06-.28-.09zm2.47 5.77c-.7.03-1.29-.22-1.72-.74l-.05-.05c-.42-.51-.62-1.12-.62-1.8 0-.34.06-.7.17-1.06.12-.38.29-.77.53-1.15.23.03.45.03.68.02.77-.04 1.58-.29 2.38-.73-.11.3-.2.64-.25 1.01-.07.53-.04 1.08.1 1.62.11.46.32.93.6 1.38-.61.37-1.22.52-1.82.5zm4.51.06c-.87.44-1.94.47-2.95.14-.31-.1-.6-.23-.88-.38.01-.05.01-.09.02-.14.07-.43.14-.83.13-1.21-.01-.42-.1-.82-.27-1.21.72-.65 1.34-1.39 1.79-2.23.39-.73.63-1.47.72-2.22.09-.72.01-1.42-.21-2.08 1.54.29 2.69.59 3.8 1.21-.13.42-.22.87-.24 1.35-.06 1.16.26 2.39.87 3.48.38.68.84 1.21 1.32 1.6-.19.32-.43.6-.71.86-.55.52-1.27.82-2.04.86-.7.04-1.53-.11-2.35-.03zm5.1-1.99c-.15.45-.45.89-.87 1.32-.72.73-1.78 1.22-2.85 1.3-.39.03-.76 0-1.1-.08.31-.35.55-.75.73-1.18.28.08.57.14.88.16.87.05 1.79-.23 2.49-.86.23-.21.43-.45.59-.71l.13.05zm1.17-3.64c-.06.62-.39 1.2-.88 1.61-.26-.13-.53-.2-.81-.21.37-.33.69-.7.93-1.12.29-.49.44-1.01.49-1.51.01-.1.02-.21.02-.32.39-.03.78.02 1.14.15.21.29.37.65.35 1.02-.02.1-.09.21-.24.38zm.87-1.75c-.22-.11-.46-.19-.71-.24.01-.44-.07-.87-.24-1.28-.21-.52-.56-.99-1.02-1.4-.49-.44-.95-.81-1.35-1.16.19-.63.26-1.29.21-1.93-.04-.51-.16-.98-.36-1.41.35.28.81.63 1.36 1.12.75.67 1.23 1.5 1.38 2.41.08.52.05 1.04-.1 1.53.7-.15 1.36.02 1.52.48.17.47-.05 1.18-.69 1.88z"/>
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">PostgreSQL</span>
                </div>
                {/* Tailwind CSS */}
                <div className="group relative">
                  <svg className="w-5 h-5 text-slate-400 hover:text-[#06B6D4] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/>
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Tailwind CSS</span>
                </div>
              </div>
            </div>
            
            {/* Developer signature */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <span className="text-xs text-slate-400">Desarrollado por</span>
              <a 
                href="https://github.com/skillparty" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <img 
                  src="/bajito-2.png" 
                  alt="Skillparty Logo" 
                  className="w-5 h-5 rounded object-contain"
                />
                <span className="text-xs font-semibold">skillparty</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
