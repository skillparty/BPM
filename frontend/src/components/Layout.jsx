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
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout, isSuperAdmin, isColaborador } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-slate-900">
                  {navigation.find(item => isActive(item.href))?.name || 'BPM'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-500">
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

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
