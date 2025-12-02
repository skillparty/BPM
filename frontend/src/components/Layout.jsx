import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Landmark,
  Circle,
  ChevronRight,
  Search,
  Command,
  Home
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import GlobalSearch from './GlobalSearch';
import NotificationCenter from './NotificationCenter';

const Layout = () => {
  const { user, logout, isSuperAdmin, isColaborador } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K = Open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // N = New order (when not in input)
      if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !searchOpen) {
        e.preventDefault();
        navigate('/orders/new');
      }
      // C = Clients (when not in input)
      if (e.key === 'c' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !searchOpen) {
        e.preventDefault();
        navigate('/clients');
      }
      // D = Dashboard (when not in input)
      if (e.key === 'd' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !searchOpen) {
        e.preventDefault();
        navigate('/dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, searchOpen]);

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = useCallback(() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    const pathNames = {
      'dashboard': 'Dashboard',
      'orders': 'Pedidos',
      'clients': 'Clientes',
      'products': 'Almacén',
      'rollos': 'Rollos',
      'reports': 'Reportes',
      'bank-config': 'Config. Bancaria',
      'users': 'Usuarios',
      'new': 'Nuevo',
      'edit': 'Editar'
    };

    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const name = pathNames[path] || (path.match(/^\d+$/) ? `#${path}` : path);
      breadcrumbs.push({ name, href, isLast: index === paths.length - 1 });
    });

    return breadcrumbs;
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Almacén', href: '/products', icon: Package },
    { name: 'Rollos', href: '/rollos', icon: Circle },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
    { name: 'Config. Bancaria', href: '/bank-config', icon: Landmark },
  ];

  const filteredNavigation = isColaborador() ? navigation.filter(item =>
    !['Reportes', 'Almacén'].includes(item.name)
  ) : navigation;

  if (isSuperAdmin()) {
    navigation.push({ name: 'Usuarios', href: '/users', icon: Users });
  }

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className={`min-h-screen bg-slate-50 ${isColaborador() ? 'role-colaborador' : ''}`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Professional ERP Style */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200
        transform transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-3 group"
              onClick={() => setSidebarOpen(false)}
            >
              <img 
                src="/BPM_logo.jpg" 
                alt="BPM Logo" 
                className="w-9 h-9 rounded-lg object-cover"
              />
              <span className="text-lg font-bold text-slate-900">BPM System</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150
                    ${active 
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={1.75} />
                    <span className={`font-medium text-sm ${active ? 'text-white' : ''}`}>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-4 h-4 text-white/70" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center space-x-3 mb-3 px-1">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.role === 'super_admin' ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar - Professional Style */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex-1 flex items-center justify-between">
              {/* Breadcrumbs */}
              <nav className="hidden lg:flex items-center space-x-1 text-sm">
                <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Home className="w-4 h-4" />
                </Link>
                {getBreadcrumbs().map((crumb, idx) => (
                  <div key={crumb.href} className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                    {crumb.isLast ? (
                      <span className="font-medium text-slate-900">{crumb.name}</span>
                    ) : (
                      <Link 
                        to={crumb.href}
                        className="text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {crumb.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
              
              <div className="flex items-center space-x-3">
                {/* Global Search Button */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Buscar...</span>
                  <kbd className="hidden md:inline-flex items-center space-x-0.5 px-1.5 py-0.5 bg-white rounded text-xs text-slate-400 border border-slate-200">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </kbd>
                </button>

                {/* Notification Center */}
                <NotificationCenter />

                {/* Date */}
                <span className="hidden md:inline text-sm text-slate-500">
                  {new Date().toLocaleDateString('es-BO', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Search Modal */}
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
