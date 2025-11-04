import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, X, Save, Package, Eye, BarChart3, Users } from 'lucide-react';
import ClientAnalytics from './ClientAnalytics';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedClientOrders, setSelectedClientOrders] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' o 'analytics'
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    empresa: '',
    tipo_cliente: '',
    razon_social: '',
    nit: '',
    pais: '',
    departamento: '',
    ciudad: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        phone: client.phone || '',
        name: client.name || '',
        empresa: client.empresa || '',
        tipo_cliente: client.tipo_cliente || '',
        razon_social: client.razon_social || '',
        nit: client.nit || '',
        pais: client.pais || '',
        departamento: client.departamento || '',
        ciudad: client.ciudad || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        phone: '',
        name: '',
        empresa: '',
        tipo_cliente: '',
        razon_social: '',
        nit: '',
        pais: '',
        departamento: '',
        ciudad: '',
        email: '',
        address: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      phone: '',
      name: '',
      empresa: '',
      tipo_cliente: '',
      razon_social: '',
      nit: '',
      pais: '',
      departamento: '',
      ciudad: '',
      email: '',
      address: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phone || !formData.name) {
      toast.error('El teléfono y el nombre son requeridos');
      return;
    }

    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.phone}`, formData);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await api.post('/clients', formData);
        toast.success('Cliente creado exitosamente');
      }
      handleCloseModal();
      fetchClients();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el cliente');
    }
  };

  const handleDelete = async (phone) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) {
      return;
    }

    try {
      await api.delete(`/clients/${phone}`);
      toast.success('Cliente eliminado exitosamente');
      fetchClients();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar el cliente');
    }
  };

  const handleViewOrders = async (client) => {
    setSelectedClient(client);
    setShowOrdersModal(true);
    setLoadingOrders(true);

    try {
      const response = await api.get(`/clients/${client.phone}/orders`);
      setSelectedClientOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      toast.error('Error al cargar los pedidos del cliente');
      setSelectedClientOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCloseOrdersModal = () => {
    setShowOrdersModal(false);
    setSelectedClient(null);
    setSelectedClientOrders([]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona la información de tus clientes</p>
        </div>
        {activeTab === 'list' && (
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Cliente</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Lista de Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Análisis por Tipo de Trabajo</span>
          </button>
        </div>
      </div>

      {/* Vista de Análisis */}
      {activeTab === 'analytics' && <ClientAnalytics />}

      {/* Grid de Clientes */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.phone} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{client.name}</h3>
                {client.empresa && (
                  <p className="text-sm text-primary-600 font-medium mt-1">🏢 {client.empresa}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">📞 {client.phone}</p>
                {client.email && (
                  <p className="text-sm text-gray-600">✉️ {client.email}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {client.tipo_cliente && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    client.tipo_cliente === 'B2B' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {client.tipo_cliente}
                  </span>
                )}
                {client.tipo_usuario && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    client.tipo_usuario === 'Activo' ? 'bg-green-100 text-green-700' :
                    client.tipo_usuario === 'Prospecto' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {client.tipo_usuario}
                  </span>
                )}
              </div>
            </div>

            {(client.pais || client.ciudad) && (
              <p className="text-sm text-gray-600 mb-2">
                📍 {[client.ciudad, client.departamento, client.pais].filter(Boolean).join(', ')}
              </p>
            )}

            {client.address && (
              <p className="text-sm text-gray-600 mb-2">
                🏠 {client.address}
              </p>
            )}

            {client.notes && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {client.notes}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                onClick={() => handleViewOrders(client)}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center space-x-1"
                title="Ver pedidos"
              >
                <Package className="w-3 h-3" />
                <span>{client.total_orders || 0} pedidos</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenModal(client)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(client.phone)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12 card">
            <p className="text-gray-500">No se encontraron clientes</p>
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Información Básica */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">Información Básica</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="label">
                        Teléfono * (ID único)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="input"
                        required
                        disabled={editingClient !== null}
                        placeholder="+591 12345678"
                      />
                    </div>

                    <div>
                      <label htmlFor="name" className="label">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="input"
                        required
                        placeholder="Nombre del cliente"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="label">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="input"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="tipo_cliente" className="label">
                        Tipo de Cliente
                      </label>
                      <select
                        id="tipo_cliente"
                        value={formData.tipo_cliente}
                        onChange={(e) => setFormData({...formData, tipo_cliente: e.target.value})}
                        className="input"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="B2B">B2B (Empresa)</option>
                        <option value="B2C">B2C (Consumidor Final)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Información Empresarial */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">Información Empresarial</h3>
                  
                  <div>
                    <label htmlFor="empresa" className="label">
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                      className="input"
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div>
                    <label htmlFor="razon_social" className="label">
                      Razón Social
                    </label>
                    <input
                      type="text"
                      id="razon_social"
                      value={formData.razon_social}
                      onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
                      className="input"
                      placeholder="Razón social de la empresa"
                    />
                  </div>

                  <div>
                    <label htmlFor="nit" className="label">
                      NIT
                    </label>
                    <input
                      type="text"
                      id="nit"
                      value={formData.nit}
                      onChange={(e) => setFormData({...formData, nit: e.target.value})}
                      className="input"
                      placeholder="Número de Identificación Tributaria"
                    />
                  </div>
                </div>

                {/* Ubicación */}
                <div className="bg-green-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">Ubicación</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="pais" className="label">
                        País
                      </label>
                      <input
                        type="text"
                        id="pais"
                        value={formData.pais}
                        onChange={(e) => setFormData({...formData, pais: e.target.value})}
                        className="input"
                        placeholder="Ej: Bolivia"
                      />
                    </div>

                    <div>
                      <label htmlFor="departamento" className="label">
                        Departamento
                      </label>
                      <input
                        type="text"
                        id="departamento"
                        value={formData.departamento}
                        onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                        className="input"
                        placeholder="Ej: La Paz"
                      />
                    </div>

                    <div>
                      <label htmlFor="ciudad" className="label">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                        className="input"
                        placeholder="Ej: La Paz"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="label">
                      Dirección Completa
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="input"
                      placeholder="Calle, número, zona, etc."
                    />
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label htmlFor="notes" className="label">
                    Notas Adicionales
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="input"
                    placeholder="Información adicional sobre el cliente..."
                  />
                </div>

                {editingClient && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Tipo de Usuario:</strong> {editingClient.tipo_usuario || 'Prospecto'} 
                      <span className="text-xs ml-2">(Se actualiza automáticamente según pedidos)</span>
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary inline-flex items-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingClient ? 'Actualizar' : 'Crear'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pedidos del Cliente */}
      {showOrdersModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Pedidos de {selectedClient?.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    📞 {selectedClient?.phone} {selectedClient?.empresa && `• 🏢 ${selectedClient.empresa}`}
                  </p>
                </div>
                <button
                  onClick={handleCloseOrdersModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando pedidos...</p>
                  </div>
                </div>
              ) : selectedClientOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Este cliente aún no tiene pedidos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recibo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Trabajo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pago
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedClientOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              #{order.receipt_number}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(order.order_date)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{order.work_type_name}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {order.items_count} items
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(order.total)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'completado' ? 'bg-green-100 text-green-800' :
                              order.status === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status === 'en_proceso' ? 'En Proceso' : 
                               order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.payment_status === 'pagado' ? 'bg-green-100 text-green-800' :
                              order.payment_status === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button
                              onClick={() => window.open(`/orders/${order.id}`, '_blank')}
                              className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Resumen */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total de Pedidos</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedClientOrders.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Monto Total</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {formatCurrency(selectedClientOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0))}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Último Pedido</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedClientOrders.length > 0 ? formatDate(selectedClientOrders[0].order_date) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseOrdersModal}
                className="btn btn-secondary w-full md:w-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
