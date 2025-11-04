import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Download, TrendingUp, DollarSign, Calendar, X, ExternalLink } from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [salesReport, setSalesReport] = useState(null);
  const [workTypesReport, setWorkTypesReport] = useState([]);
  const [paymentTypesReport, setPaymentTypesReport] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sales, workTypes, paymentTypes, monthly, clients] = await Promise.all([
        api.get('/reports/sales', { params: { date_from: dateFrom, date_to: dateTo } }),
        api.get('/reports/work-types', { params: { date_from: dateFrom, date_to: dateTo } }),
        api.get('/reports/payment-types', { params: { date_from: dateFrom, date_to: dateTo } }),
        api.get('/reports/monthly', { params: { year: new Date().getFullYear() } }),
        api.get('/reports/top-clients', { params: { limit: 10 } })
      ]);

      setSalesReport(sales.data);
      
      // Filtrar solo SUBLIM, DTF, DTF+PL y INSIG-T
      const allowedTypes = ['SUBLIM', 'DTF', 'DTF+PL', 'INSIG-T'];
      const filteredWorkTypes = workTypes.data.filter(item => 
        allowedTypes.includes(item.work_type)
      );
      setWorkTypesReport(filteredWorkTypes);
      
      setPaymentTypesReport(paymentTypes.data);
      setMonthlyReport(monthly.data);
      setTopClients(clients.data);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      setLoadingPending(true);
      const response = await api.get('/reports/pending-payments', {
        params: { date_from: dateFrom, date_to: dateTo }
      });
      setPendingOrders(response.data.orders);
      setShowPendingModal(true);
    } catch (error) {
      console.error('Error al cargar pedidos pendientes:', error);
      toast.error('Error al cargar pedidos pendientes');
    } finally {
      setLoadingPending(false);
    }
  };

  const handlePaymentBarClick = (paymentType) => {
    if (paymentType === 'Pago Pendiente') {
      fetchPendingOrders();
    }
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      'pagado': 'bg-green-100 text-green-700',
      'parcial': 'bg-yellow-100 text-yellow-700',
      'pendiente': 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
        <p className="text-gray-500 mt-1">Analiza el rendimiento del negocio</p>
      </div>

      {/* Filtros de Fecha */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="date_from" className="label">
              Desde
            </label>
            <input
              type="date"
              id="date_from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="date_to" className="label">
              Hasta
            </label>
            <input
              type="date"
              id="date_to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReports}
              className="btn btn-primary w-full"
            >
              Actualizar Reportes
            </button>
          </div>
        </div>
      </div>

      {/* Resumen de Ventas */}
      {salesReport && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Ventas ({dateFrom} - {dateTo})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ventas</p>
                <p className="text-3xl font-bold text-gray-900">
                  Bs. {salesReport.summary?.total_amount?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pedidos</p>
                <p className="text-3xl font-bold text-gray-900">
                  {salesReport.summary?.total_orders || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Tipo de Trabajo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ventas por Tipo de Trabajo
          </h3>
          
          <div className="space-y-3">
            {workTypesReport.map((item) => (
              <div key={item.code} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.work_type}</span>
                  <div className="text-right">
                    <span className="text-gray-900 font-semibold">
                      Bs. {parseFloat(item.total_amount).toFixed(2)}
                    </span>
                    <span className="text-gray-500 ml-2">
                      ({item.total_orders} pedidos)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (parseFloat(item.total_amount) / 
                         Math.max(...workTypesReport.map(i => parseFloat(i.total_amount)))) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            ))}

            {workTypesReport.length === 0 && (
              <p className="text-center py-8 text-gray-500">No hay datos disponibles</p>
            )}
          </div>
        </div>

        {/* Ventas por Forma de Pago */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ventas por Forma de Pago
          </h3>
          
          <div className="space-y-3">
            {paymentTypesReport.map((item) => {
              const isPending = item.payment_type === 'Pago Pendiente';
              const barColor = isPending ? 'bg-yellow-500' : 'bg-green-600';
              
              return (
                <div key={item.payment_type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.payment_type}</span>
                    <div className="text-right">
                      <span className="text-gray-900 font-semibold">
                        Bs. {parseFloat(item.total_amount).toFixed(2)}
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({item.total_orders} pedidos)
                      </span>
                    </div>
                  </div>
                  <div 
                    className={`w-full bg-gray-200 rounded-full h-2 ${isPending ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onClick={() => handlePaymentBarClick(item.payment_type)}
                    title={isPending ? 'Clic para ver detalles' : ''}
                  >
                    <div
                      className={`${barColor} h-2 rounded-full transition-all`}
                      style={{
                        width: `${Math.min(
                          (parseFloat(item.total_amount) / 
                           Math.max(...paymentTypesReport.map(i => parseFloat(i.total_amount)))) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {paymentTypesReport.length === 0 && (
              <p className="text-center py-8 text-gray-500">No hay datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Clientes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 10 Clientes
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Gastado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Pedido</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topClients.map((client, index) => (
                <tr key={client.phone || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    {client.email && (
                      <div className="text-sm text-gray-500">{client.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {client.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    Bs. {parseFloat(client.total_spent).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.last_order_date).toLocaleDateString('es-BO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topClients.length === 0 && (
          <p className="text-center py-8 text-gray-500">No hay datos disponibles</p>
        )}
      </div>

      {/* Reporte Mensual */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ventas Mensuales {new Date().getFullYear()}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Promedio</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyReport.map((month) => (
                <tr key={month.month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.month_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {month.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    Bs. {parseFloat(month.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    Bs. {parseFloat(month.average_order).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {monthlyReport.length === 0 && (
          <p className="text-center py-8 text-gray-500">No hay datos disponibles</p>
        )}
      </div>

      {/* Modal de Pedidos Pendientes */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Pedidos con Pago Pendiente
                </h2>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingPending ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-800 font-medium">Total de pedidos pendientes</p>
                        <p className="text-2xl font-bold text-yellow-900">{pendingOrders.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-yellow-800 font-medium">Monto total pendiente</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          Bs. {pendingOrders.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recibo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajo</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado Pago</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">
                                #{order.receipt_number}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.order_date).toLocaleDateString('es-BO')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{order.client_name}</div>
                              {order.client_phone && (
                                <div className="text-sm text-gray-500">{order.client_phone}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.work_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                              Bs. {parseFloat(order.total).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(order.payment_status)}`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <a
                                href={`/orders/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700"
                                title="Ver detalles"
                              >
                                <ExternalLink className="w-5 h-5 inline" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pendingOrders.length === 0 && (
                    <p className="text-center py-12 text-gray-500">
                      No hay pedidos con pago pendiente en el rango de fechas seleccionado
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
