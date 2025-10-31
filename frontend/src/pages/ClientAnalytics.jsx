import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Download } from 'lucide-react';

const ClientAnalytics = () => {
  const [clientsData, setClientsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'total_orders', direction: 'desc' });

  useEffect(() => {
    fetchClientStats();
  }, []);

  const fetchClientStats = async () => {
    try {
      const response = await api.get('/clients/stats/analytics');
      setClientsData(response.data.clients || []);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar las estadísticas de clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedClients = [...clientsData].sort((a, b) => {
    if (sortConfig.key === 'name') {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortConfig.direction === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }

    if (sortConfig.key === 'total_orders') {
      return sortConfig.direction === 'asc'
        ? a.total_orders - b.total_orders
        : b.total_orders - a.total_orders;
    }

    if (sortConfig.key === 'total_spent') {
      return sortConfig.direction === 'asc'
        ? a.total_spent - b.total_spent
        : b.total_spent - a.total_spent;
    }

    return 0;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-primary-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary-600" />
    );
  };

  const exportToCSV = () => {
    const headers = ['Cliente', 'Teléfono', 'Empresa', 'Tipo Cliente', 'Total Pedidos', 'Tipo de Trabajo', 'Pedidos por Tipo', 'Monto Total'];
    const rows = [];

    sortedClients.forEach(client => {
      client.work_types.forEach((wt, index) => {
        rows.push([
          index === 0 ? client.name : '',
          index === 0 ? client.phone : '',
          index === 0 ? (client.empresa || '-') : '',
          index === 0 ? (client.tipo_cliente || '-') : '',
          index === 0 ? client.total_orders : '',
          wt.work_type_name,
          wt.order_count,
          index === 0 ? formatCurrency(client.total_spent) : ''
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_estadisticas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Análisis de Clientes por Tipo de Trabajo</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm opacity-90">Total de Clientes</p>
            <p className="text-3xl font-bold">{clientsData.length}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm opacity-90">Total de Pedidos</p>
            <p className="text-3xl font-bold">
              {clientsData.reduce((sum, client) => sum + client.total_orders, 0)}
            </p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm opacity-90">Monto Total</p>
            <p className="text-3xl font-bold">
              {formatCurrency(clientsData.reduce((sum, client) => sum + client.total_spent, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Ordenar por:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSort('name')}
              className={`btn btn-sm ${
                sortConfig.key === 'name' ? 'btn-primary' : 'btn-secondary'
              } inline-flex items-center space-x-1`}
            >
              <span>Nombre Cliente</span>
              {getSortIcon('name')}
            </button>
            <button
              onClick={() => handleSort('total_orders')}
              className={`btn btn-sm ${
                sortConfig.key === 'total_orders' ? 'btn-primary' : 'btn-secondary'
              } inline-flex items-center space-x-1`}
            >
              <span>Cantidad Pedidos</span>
              {getSortIcon('total_orders')}
            </button>
            <button
              onClick={() => handleSort('total_spent')}
              className={`btn btn-sm ${
                sortConfig.key === 'total_spent' ? 'btn-primary' : 'btn-secondary'
              } inline-flex items-center space-x-1`}
            >
              <span>Monto Total</span>
              {getSortIcon('total_spent')}
            </button>
            <button
              onClick={exportToCSV}
              className="btn btn-sm btn-secondary inline-flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de datos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipos de Trabajo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Pedido
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedClients.map((client) => (
                <tr key={client.phone} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      {client.empresa && (
                        <div className="text-xs text-gray-500">🏢 {client.empresa}</div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {client.tipo_cliente && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            client.tipo_cliente === 'B2B' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {client.tipo_cliente}
                          </span>
                        )}
                        {client.tipo_usuario && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            client.tipo_usuario === 'Activo' ? 'bg-green-100 text-green-700' :
                            client.tipo_usuario === 'Prospecto' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {client.tipo_usuario}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">📞 {client.phone}</div>
                    {client.email && (
                      <div className="text-xs text-gray-500">📧 {client.email}</div>
                    )}
                    {(client.ciudad || client.departamento) && (
                      <div className="text-xs text-gray-500">
                        📍 {[client.ciudad, client.departamento].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary-100 text-primary-800">
                        {client.total_orders}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {client.work_types.map((wt, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                          <span className="text-sm text-gray-700">{wt.work_type_name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {wt.order_count} pedidos
                            </span>
                            <span className="text-xs font-medium text-gray-600">
                              {formatCurrency(wt.total_spent)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(client.total_spent)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(client.last_order_date)}</div>
                    {client.first_order_date && (
                      <div className="text-xs text-gray-500">
                        Desde: {formatDate(client.first_order_date)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay datos de clientes con pedidos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAnalytics;
