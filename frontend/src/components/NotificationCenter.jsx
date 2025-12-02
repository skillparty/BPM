import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Package, 
  CreditCard,
  Clock,
  ChevronRight,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const dropdownRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar notificaciones
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setSummary(response.data.summary || { total: 0 });
      setLastFetch(new Date());
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar y cada 5 minutos
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Iconos por tipo
  const getIcon = (type) => {
    switch (type) {
      case 'stock_bajo':
        return <Package className="w-5 h-5 text-amber-500" />;
      case 'stock_agotado':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'pago_pendiente':
        return <CreditCard className="w-5 h-5 text-red-500" />;
      case 'pago_parcial':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  // Color de prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-amber-500 bg-amber-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-slate-300 bg-slate-50';
    }
  };

  // Enlace según tipo
  const getLink = (notification) => {
    switch (notification.type) {
      case 'stock_bajo':
      case 'stock_agotado':
        return '/rollos';
      case 'pago_pendiente':
      case 'pago_parcial':
        return `/orders/${notification.data?.id}`;
      default:
        return '#';
    }
  };

  const hasHighPriority = summary.high > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`relative p-2 rounded-lg transition-colors ${
          isOpen 
            ? 'bg-primary-100 text-primary-600' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge de contador */}
        {summary.total > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold text-white rounded-full px-1 ${
            hasHighPriority ? 'bg-red-500 animate-pulse' : 'bg-primary-500'
          }`}>
            {summary.total > 99 ? '99+' : summary.total}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-fade-in-down overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Notificaciones</h3>
              {summary.total > 0 && (
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  {summary.total}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Resumen por tipo */}
          {summary.total > 0 && (
            <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 border-b border-slate-100">
              <div className="text-center p-1">
                <div className="text-lg font-bold text-red-600">{summary.byType?.stock_agotado || 0}</div>
                <div className="text-[10px] text-slate-500">Agotados</div>
              </div>
              <div className="text-center p-1">
                <div className="text-lg font-bold text-amber-600">{summary.byType?.stock_bajo || 0}</div>
                <div className="text-[10px] text-slate-500">Stock bajo</div>
              </div>
              <div className="text-center p-1">
                <div className="text-lg font-bold text-red-600">{summary.byType?.pago_pendiente || 0}</div>
                <div className="text-[10px] text-slate-500">Pendientes</div>
              </div>
              <div className="text-center p-1">
                <div className="text-lg font-bold text-blue-600">{summary.byType?.pago_parcial || 0}</div>
                <div className="text-[10px] text-slate-500">Parciales</div>
              </div>
            </div>
          )}

          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle className="w-12 h-12 mb-2 text-green-400" />
                <p className="font-medium text-slate-600">¡Todo en orden!</p>
                <p className="text-sm">No hay notificaciones pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={getLink(notification)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {notification.message}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {lastFetch && `Actualizado ${lastFetch.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/rollos" 
                    onClick={() => setIsOpen(false)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Ver Rollos
                  </Link>
                  <Link 
                    to="/orders?payment_status=pendiente" 
                    onClick={() => setIsOpen(false)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Ver Pendientes
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
