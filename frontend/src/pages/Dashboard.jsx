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

  // Preparar datos para gráficos de torta (solo del mes actual)
  const salesData = [
    { name: 'Ventas Pagadas', value: (dashboard?.month?.amount || 0) - (dashboard?.month_pending_payments?.amount || 0), color: '#10b981' },
    { name: 'Ventas Pendientes', value: dashboard?.month_pending_payments?.amount || 0, color: '#f59e0b' }
  ];

  const ticketPromedio = dashboard?.month?.orders > 0 
    ? (dashboard?.month?.amount / dashboard?.month?.orders).toFixed(2)
    : 0;

  // Filtrar solo DTF, DTF+, SUBLIM, INSIG-T con colores consistentes
  const allowedTypes = ['DTF', 'DTF+', 'SUBLIM', 'INSIG-T'];
  const workTypeData = (dashboard?.sales_by_work_type || [])
    .filter(item => allowedTypes.includes(item.work_type))
    .map((item) => ({
      name: item.work_type,
      value: parseInt(item.total_orders),
      color: {
        'DTF': '#3b82f6',
        'DTF+': '#8b5cf6',
        'SUBLIM': '#ec4899',
        'INSIG-T': '#f59e0b'
      }[item.work_type] || '#6b7280'
    }));

  // Función para generar datos de gráfico de torta por período
  const getWorkTypeChartData = (periodData) => {
    if (!periodData?.by_work_type) return [];
    return periodData.by_work_type
      .filter(item => allowedTypes.includes(item.work_type))
      .map((item, idx) => ({
        name: item.work_type,
        value: parseInt(item.total_orders),
        amount: parseFloat(item.total_amount || 0),
        color: {
          'DTF': '#3b82f6',
          'DTF+': '#8b5cf6',
          'SUBLIM': '#ec4899',
          'INSIG-T': '#f59e0b'
        }[item.work_type] || '#6b7280'
      }));
  };

  const todayChartData = getWorkTypeChartData(dashboard?.today);
  const monthChartData = getWorkTypeChartData(dashboard?.month);
  const yearChartData = getWorkTypeChartData(dashboard?.year);
  const pendingChartData = getWorkTypeChartData(dashboard?.pending_payments);

  // Función para renderizar labels en gráficos de torta
  const renderLabel = (entry) => {
    if (entry.value === 0) return '';
    const percent = ((entry.percent || 0) * 100).toFixed(0);
    return `${entry.value}`;
  };

  // Función para renderizar labels con padding (para evitar que se corten)
  const renderLabelWithPadding = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
    if (value === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20; // Más espacio fuera del gráfico
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#374151" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {value}
      </text>
    );
  };

  // Obtener ventas en Bs por tipo de trabajo
  const getWorkTypeSales = (workType) => {
    const data = dashboard?.sales_by_work_type?.find(item => item.work_type === workType);
    return parseFloat(data?.total_amount || 0);
  };

  // Obtener cantidad de pedidos por tipo de trabajo
  const getWorkTypeOrders = (workType) => {
    const data = dashboard?.sales_by_work_type?.find(item => item.work_type === workType);
    return parseInt(data?.total_orders || 0);
  };

  // Obtener metraje total por tipo de trabajo
  const getWorkTypeMetraje = (workType) => {
    const data = dashboard?.sales_by_work_type?.find(item => item.work_type === workType);
    return parseFloat(data?.total_metraje || 0);
  };

  // Obtener cantidad de insignias por tipo de trabajo
  const getWorkTypeInsignias = (workType) => {
    const data = dashboard?.sales_by_work_type?.find(item => item.work_type === workType);
    return parseFloat(data?.total_insignias || 0);
  };

  const dtfMetraje = getWorkTypeMetraje('DTF');
  const dtfOrders = getWorkTypeOrders('DTF');
  
  const insigCantidad = getWorkTypeInsignias('INSIG-T');
  const insigOrders = getWorkTypeOrders('INSIG-T');
  
  const dtfPlusMetraje = getWorkTypeMetraje('DTF+');
  const dtfPlusOrders = getWorkTypeOrders('DTF+');
  
  const sublimMetraje = getWorkTypeMetraje('SUBLIM');
  const sublimOrders = getWorkTypeOrders('SUBLIM');

  const COLORS = {
    'Ventas Pagadas': '#10b981',
    'Ventas Pendientes': '#f59e0b'
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards con Gráficos de Torta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas Hoy */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                Bs. {dashboard?.today?.amount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500">{dashboard?.today?.orders || 0} pedidos</p>
            </div>
            <div className="bg-green-500 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          {todayChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={todayChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  dataKey="value"
                  label={renderLabelWithPadding}
                  labelLine={false}
                >
                  {todayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
          )}
        </div>

        {/* Ventas del Mes */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                Bs. {dashboard?.month?.amount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500">{dashboard?.month?.orders || 0} pedidos</p>
            </div>
            <div className="bg-blue-500 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          {monthChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={monthChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  dataKey="value"
                  label={renderLabelWithPadding}
                  labelLine={false}
                >
                  {monthChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
          )}
        </div>

        {/* Ventas del Año */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas del Año</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                Bs. {dashboard?.year?.amount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500">{dashboard?.year?.orders || 0} pedidos</p>
            </div>
            <div className="bg-purple-500 p-2 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
          </div>
          {yearChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={yearChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  dataKey="value"
                  label={renderLabelWithPadding}
                  labelLine={false}
                >
                  {yearChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
          )}
        </div>

        {/* Pagos Pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                Bs. {dashboard?.pending_payments?.amount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500">{dashboard?.pending_payments?.count || 0} pedidos</p>
            </div>
            <div className="bg-orange-500 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          {pendingChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pendingChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  dataKey="value"
                  label={renderLabelWithPadding}
                  labelLine={false}
                >
                  {pendingChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
          )}
        </div>
      </div>

      {/* Metas por Tipo de Servicio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* DTF */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">DTF</h3>
          </div>
          <SalesGauge current={dtfMetraje} target={500} type="metros" />
          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="font-semibold text-blue-600">{dtfOrders} pedidos</p>
            <p className="text-xs text-gray-500">Meta: 500 metros/mes</p>
          </div>
        </div>

        {/* INSIG-T */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-4 h-4 text-orange-600" />
            <h3 className="text-base font-semibold text-gray-900">INSIG-T</h3>
          </div>
          <SalesGauge current={insigCantidad} target={3000} type="unidades" />
          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="font-semibold text-orange-600">{insigOrders} pedidos</p>
            <p className="text-xs text-gray-500">Meta: 3,000 unidades/mes</p>
          </div>
        </div>

        {/* DTF+ */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-4 h-4 text-purple-600" />
            <h3 className="text-base font-semibold text-gray-900">DTF+</h3>
          </div>
          <SalesGauge current={dtfPlusMetraje} target={500} type="metros" />
          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="font-semibold text-purple-600">{dtfPlusOrders} pedidos</p>
            <p className="text-xs text-gray-500">Meta: 500 metros/mes</p>
          </div>
        </div>

        {/* SUBLIM */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-4 h-4 text-pink-600" />
            <h3 className="text-base font-semibold text-gray-900">SUBLIM</h3>
          </div>
          <SalesGauge current={sublimMetraje} target={500} type="metros" />
          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="font-semibold text-pink-600">{sublimOrders} pedidos</p>
            <p className="text-xs text-gray-500">Meta: 500 metros/mes</p>
          </div>
        </div>
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
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={salesData}
                cx="50%"
                cy="45%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={false}
              >
                {salesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `Bs. ${value.toFixed(2)}`} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                formatter={(value, entry) => {
                  const dataEntry = salesData.find(d => d.name === value);
                  const total = salesData.reduce((sum, item) => sum + item.value, 0);
                  const percent = total > 0 ? ((dataEntry?.value || 0) / total * 100).toFixed(0) : 0;
                  return `${value} (${percent}%)`;
                }}
              />
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
            <span className="font-medium">Ver Almacén</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
