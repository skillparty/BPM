import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Ventas Hoy',
      value: `Bs. ${dashboard?.today?.amount?.toFixed(2) || '0.00'}`,
      description: `${dashboard?.today?.orders || 0} pedidos`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+12%'
    },
    {
      name: 'Ventas del Mes',
      value: `Bs. ${dashboard?.month?.amount?.toFixed(2) || '0.00'}`,
      description: `${dashboard?.month?.orders || 0} pedidos`,
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      name: 'Ventas del Año',
      value: `Bs. ${dashboard?.year?.amount?.toFixed(2) || '0.00'}`,
      description: `${dashboard?.year?.orders || 0} pedidos`,
      icon: ShoppingCart,
      color: 'bg-purple-500'
    },
    {
      name: 'Pagos Pendientes',
      value: `Bs. ${dashboard?.pending_payments?.amount?.toFixed(2) || '0.00'}`,
      description: `${dashboard?.pending_payments?.count || 0} pedidos`,
      icon: AlertCircle,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Pedidos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Últimos Pedidos</h3>
            <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {dashboard?.recent_orders?.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{order.client_name}</p>
                  <p className="text-sm text-gray-500">
                    Recibo: {order.receipt_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Bs. {order.total.toFixed(2)}
                  </p>
                  <span className={`badge ${
                    order.payment_status === 'pagado' ? 'badge-success' : 
                    order.payment_status === 'parcial' ? 'badge-warning' : 
                    'badge-danger'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>
              </Link>
            ))}

            {(!dashboard?.recent_orders || dashboard.recent_orders.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No hay pedidos recientes
              </div>
            )}
          </div>
        </div>

        {/* Ventas por Tipo de Trabajo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ventas por Tipo de Trabajo (Este Mes)
          </h3>

          <div className="space-y-3">
            {dashboard?.sales_by_work_type?.map((item) => (
              <div key={item.work_type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.work_type}</span>
                  <span className="text-gray-900 font-semibold">
                    Bs. {parseFloat(item.total_amount).toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (parseFloat(item.total_amount) / 
                         Math.max(...dashboard.sales_by_work_type.map(i => parseFloat(i.total_amount)))) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">{item.total_orders} pedidos</p>
              </div>
            ))}

            {(!dashboard?.sales_by_work_type || dashboard.sales_by_work_type.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No hay datos de ventas este mes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/orders/new"
            className="flex items-center justify-center space-x-2 p-4 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">Nuevo Pedido</span>
          </Link>
          
          <Link
            to="/clients"
            className="flex items-center justify-center space-x-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Ver Clientes</span>
          </Link>
          
          <Link
            to="/reports"
            className="flex items-center justify-center space-x-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Ver Reportes</span>
          </Link>
          
          <Link
            to="/products"
            className="flex items-center justify-center space-x-2 p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Ver Productos</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
