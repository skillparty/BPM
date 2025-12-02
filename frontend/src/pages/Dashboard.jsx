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
  Target,
  X,
  Eye,
  FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import SalesGauge from '../components/SalesGauge';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordersModal, setOrdersModal] = useState({ open: false, title: '', orders: [], loading: false });

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

  // Función para cargar pedidos filtrados
  const fetchFilteredOrders = async (filters, title) => {
    setOrdersModal({ open: true, title, orders: [], loading: true });
    try {
      const params = new URLSearchParams();
      if (filters.work_type) params.append('work_type', filters.work_type);
      if (filters.payment_status) params.append('payment_status', filters.payment_status);
      if (filters.period) params.append('period', filters.period);
      params.append('limit', '100');
      
      const response = await api.get(`/orders?${params.toString()}`);
      setOrdersModal(prev => ({ ...prev, orders: response.data.orders || [], loading: false }));
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      toast.error('Error al cargar los pedidos');
      setOrdersModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Manejadores de clic para las tortas
  const handlePieClick = (data, period, paymentStatus = null) => {
    if (!data || !data.name) return;
    
    const filters = {
      work_type: data.name,
      period: period
    };
    if (paymentStatus) filters.payment_status = paymentStatus;
    
    const periodNames = {
      'today': 'Hoy',
      'month': 'del Mes',
      'year': 'del Año',
      'pending': 'Pendientes'
    };
    
    const title = `Pedidos ${data.name} - ${periodNames[period] || period}${paymentStatus ? ` (${paymentStatus})` : ''}`;
    fetchFilteredOrders(filters, title);
  };

  const closeOrdersModal = () => {
    setOrdersModal({ open: false, title: '', orders: [], loading: false });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ventas Hoy */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Ventas Hoy</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 tracking-tight">
                Bs. {dashboard?.today?.amount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{dashboard?.today?.orders || 0} pedidos</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/25">
              <DollarSign className="w-5 h-5 text-white" strokeWidth={2} />
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
                  onClick={(data) => handlePieClick(data, 'today')}
                  style={{ cursor: 'pointer' }}
                >
                  {todayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Sin datos</p>
          )}
        </div>

        {/* Ventas del Mes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Ventas del Mes</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 tracking-tight">
                Bs. {dashboard?.month?.amount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{dashboard?.month?.orders || 0} pedidos</p>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/25">
              <TrendingUp className="w-5 h-5 text-white" strokeWidth={2} />
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
                  onClick={(data) => handlePieClick(data, 'month')}
                  style={{ cursor: 'pointer' }}
                >
                  {monthChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Sin datos</p>
          )}
        </div>

        {/* Ventas del Año */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Ventas del Año</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 tracking-tight">
                Bs. {dashboard?.year?.amount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{dashboard?.year?.orders || 0} pedidos</p>
            </div>
            <div className="bg-gradient-to-br from-violet-400 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-violet-500/25">
              <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2} />
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
                  onClick={(data) => handlePieClick(data, 'year')}
                  style={{ cursor: 'pointer' }}
                >
                  {yearChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Sin datos</p>
          )}
        </div>

        {/* Pagos Pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Pagos Pendientes</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 tracking-tight">
                Bs. {dashboard?.pending_payments?.amount?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{dashboard?.pending_payments?.count || 0} pedidos</p>
            </div>
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2.5 rounded-xl shadow-lg shadow-amber-500/25">
              <AlertCircle className="w-5 h-5 text-white" strokeWidth={2} />
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
                  onClick={(data) => handlePieClick(data, 'pending', 'pendiente')}
                  style={{ cursor: 'pointer' }}
                >
                  {pendingChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Sin datos</p>
          )}
        </div>
      </div>

      {/* Metas por Tipo de Servicio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* DTF */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-4 h-4 text-blue-500" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900">DTF</h3>
          </div>
          <SalesGauge current={dtfMetraje} target={500} type="metros" />
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-blue-600">{dtfOrders} pedidos</p>
            <p className="text-xs text-slate-400 mt-0.5">Meta: 500 metros/mes</p>
          </div>
        </div>

        {/* INSIG-T */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900">INSIG-T</h3>
          </div>
          <SalesGauge current={insigCantidad} target={3000} type="unidades" />
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-amber-600">{insigOrders} pedidos</p>
            <p className="text-xs text-slate-400 mt-0.5">Meta: 3,000 unidades/mes</p>
          </div>
        </div>

        {/* DTF+ */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-4 h-4 text-violet-500" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900">DTF+</h3>
          </div>
          <SalesGauge current={dtfPlusMetraje} target={500} type="metros" />
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-violet-600">{dtfPlusOrders} pedidos</p>
            <p className="text-xs text-slate-400 mt-0.5">Meta: 500 metros/mes</p>
          </div>
        </div>

        {/* SUBLIM */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-4 h-4 text-pink-500" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900">SUBLIM</h3>
          </div>
          <SalesGauge current={sublimMetraje} target={500} type="metros" />
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-pink-600">{sublimOrders} pedidos</p>
            <p className="text-xs text-slate-400 mt-0.5">Meta: 500 metros/mes</p>
          </div>
        </div>
      </div>

      {/* Meta de Ventas y Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Medidor de Meta Mensual */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-primary-500" strokeWidth={1.75} />
            <h3 className="text-base font-semibold text-slate-900">Meta de Ventas del Mes</h3>
          </div>
          <SalesGauge current={dashboard?.month?.orders || 0} target={400} />
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600">Meta: 400 pedidos/mes</p>
            <p className="text-xs text-slate-400 mt-0.5">~100 pedidos/semana</p>
          </div>
        </div>

        {/* Gráfico de Ventas */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Resumen de Ventas del Mes</h3>
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
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-slate-50/80 rounded-xl text-center">
              <p className="text-xs text-slate-500 font-medium">Total Ventas</p>
              <p className="text-lg font-semibold text-slate-900 mt-0.5">Bs. {(dashboard?.month?.amount || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl text-center">
              <p className="text-xs text-slate-500 font-medium">Ticket Promedio</p>
              <p className="text-lg font-semibold text-slate-900 mt-0.5">Bs. {ticketPromedio}</p>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl text-center">
              <p className="text-xs text-slate-500 font-medium">Total Pedidos</p>
              <p className="text-lg font-semibold text-slate-900 mt-0.5">{dashboard?.month?.orders || 0}</p>
            </div>
            <div className="p-3 bg-amber-50/80 rounded-xl text-center">
              <p className="text-xs text-amber-600 font-medium">Pendientes</p>
              <p className="text-lg font-semibold text-amber-600 mt-0.5">{dashboard?.month_pending_payments?.count || 0}</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Tipos de Trabajo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pedidos por Tipo de Trabajo</h3>
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
                    <span className="text-sm text-slate-700">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No hay datos de tipos de trabajo este mes
            </div>
          )}
        </div>
      </div>

      {/* Últimos Pedidos */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-900">Últimos Pedidos</h3>
          <Link to="/orders" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboard?.recent_orders?.slice(0, 6).map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="group flex flex-col p-4 bg-slate-50/80 rounded-xl hover:bg-slate-100/80 transition-all duration-200 border border-slate-200/60 hover:border-slate-300/60"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-slate-900 truncate group-hover:text-primary-600 transition-colors">{order.client_name}</p>
                <span className={`badge ${
                  order.payment_status === 'pagado' ? 'badge-success' : 
                  order.payment_status === 'parcial' ? 'badge-warning' : 
                  'badge-danger'
                }`}>
                  {order.payment_status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                #{order.receipt_number}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                Bs. {parseFloat(order.total || 0).toFixed(2)}
              </p>
            </Link>
          ))}

          {(!dashboard?.recent_orders || dashboard.recent_orders.length === 0) && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <p>No hay pedidos recientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-base font-semibold text-slate-900 mb-5">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/orders/new"
            className="group flex items-center justify-center space-x-2.5 p-4 bg-primary-50/80 text-primary-700 rounded-xl hover:bg-primary-100 transition-all duration-200 border border-primary-200/60"
          >
            <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.75} />
            <span className="font-medium">Nuevo Pedido</span>
          </Link>
          
          <Link
            to="/clients"
            className="group flex items-center justify-center space-x-2.5 p-4 bg-emerald-50/80 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all duration-200 border border-emerald-200/60"
          >
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.75} />
            <span className="font-medium">Ver Clientes</span>
          </Link>
          
          <Link
            to="/reports"
            className="group flex items-center justify-center space-x-2.5 p-4 bg-violet-50/80 text-violet-700 rounded-xl hover:bg-violet-100 transition-all duration-200 border border-violet-200/60"
          >
            <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.75} />
            <span className="font-medium">Ver Reportes</span>
          </Link>
          
          <Link
            to="/products"
            className="group flex items-center justify-center space-x-2.5 p-4 bg-amber-50/80 text-amber-700 rounded-xl hover:bg-amber-100 transition-all duration-200 border border-amber-200/60"
          >
            <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.75} />
            <span className="font-medium">Ver Almacén</span>
          </Link>
        </div>
      </div>

      {/* Modal de Pedidos */}
      {ordersModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-xl">
                  <FileText className="w-5 h-5 text-primary-600" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{ordersModal.title}</h3>
                  <p className="text-sm text-slate-500">{ordersModal.orders.length} pedidos encontrados</p>
                </div>
              </div>
              <button
                onClick={closeOrdersModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-auto max-h-[calc(85vh-140px)]">
              {ordersModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : ordersModal.orders.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No se encontraron pedidos</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recibo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pago</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ordersModal.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-slate-900">#{order.receipt_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{order.client_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-600">
                            {new Date(order.order_date).toLocaleDateString('es-BO')}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-700">{order.work_type_name || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-slate-900">Bs. {parseFloat(order.total || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'entregado' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'en_proceso' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.payment_status === 'pagado' ? 'bg-emerald-100 text-emerald-700' :
                            order.payment_status === 'parcial' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            to={`/orders/${order.id}`}
                            target="_blank"
                            className="inline-flex items-center justify-center p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" strokeWidth={1.75} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            {!ordersModal.loading && ordersModal.orders.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Total: <span className="font-semibold text-slate-900">
                    Bs. {ordersModal.orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2)}
                  </span>
                </p>
                <button
                  onClick={closeOrdersModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
