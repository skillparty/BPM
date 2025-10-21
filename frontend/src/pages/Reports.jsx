import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Download, TrendingUp, DollarSign, Calendar } from 'lucide-react';

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
      setWorkTypesReport(workTypes.data);
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
            {paymentTypesReport.map((item) => (
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
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
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
            ))}

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
                <tr key={client.id} className="hover:bg-gray-50">
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
    </div>
  );
};

export default Reports;
