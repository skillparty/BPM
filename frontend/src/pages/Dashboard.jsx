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
  Clock,
  Target
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import SalesGauge from '../components/SalesGauge';

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

  // Preparar datos para gráficos de torta (solo del mes actual)
  const salesData = [
    { name: 'Ventas Pagadas', value: (dashboard?.month?.amount || 0) - (dashboard?.month_pending_payments?.amount || 0), color: '#10b981' },
    { name: 'Ventas Pendientes', value: dashboard?.month_pending_payments?.amount || 0, color: '#f59e0b' }
  ];

  const ticketPromedio = dashboard?.month?.orders > 0 
    ? (dashboard?.month?.amount / dashboard?.month?.orders).toFixed(2)
    : 0;

  // Filtrar solo DTF, DTF+PL, SUBLIM, INSIG-T
  const allowedTypes = ['DTF', 'DTF+PL', 'SUBLIM', 'INSIG-T'];
  const workTypeData = (dashboard?.sales_by_work_type || [])
    .filter(item => allowedTypes.includes(item.work_type))
    .map((item, idx) => ({
      name: item.work_type,
      value: parseInt(item.total_orders),
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][idx % 4]
    }));

  const COLORS = {
    'Ventas Pagadas': '#10b981',
    'Ventas Pendientes': '#f59e0b'
  };

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

      {/* Meta de Ventas y Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medidor de Meta Mensual */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Meta de Ventas del Mes</h3>
          </div>
          <SalesGauge current={dashboard?.month?.orders || 0} target={400} />
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Meta: 400 pedidos/mes</p>
            <p className="text-xs text-gray-500">~100 pedidos/semana</p>
          </div>
        </div>

        {/* Gráfico de Ventas */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Ventas del Mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={salesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {salesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `Bs. ${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Total Ventas</p>
              <p className="text-lg font-bold text-gray-900">Bs. {(dashboard?.month?.amount || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Ticket Promedio</p>
              <p className="text-lg font-bold text-gray-900">Bs. {ticketPromedio}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Total Pedidos</p>
              <p className="text-lg font-bold text-gray-900">{dashboard?.month?.orders || 0}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Pendientes (mes)</p>
              <p className="text-lg font-bold text-orange-600">{dashboard?.month_pending_payments?.count || 0}</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Tipos de Trabajo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos por Tipo de Trabajo</h3>
          {workTypeData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={workTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {workTypeData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay datos de tipos de trabajo este mes
            </div>
          )}
        </div>
      </div>

      {/* Últimos Pedidos */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Últimos Pedidos</h3>
          <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dashboard?.recent_orders?.slice(0, 6).map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-gray-900 truncate">{order.client_name}</p>
                <span className={`badge ${
                  order.payment_status === 'pagado' ? 'badge-success' : 
                  order.payment_status === 'parcial' ? 'badge-warning' : 
                  'badge-danger'
                }`}>
                  {order.payment_status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Recibo: {order.receipt_number}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                Bs. {parseFloat(order.total || 0).toFixed(2)}
              </p>
            </Link>
          ))}

          {(!dashboard?.recent_orders || dashboard.recent_orders.length === 0) && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No hay pedidos recientes
            </div>
          )}
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
