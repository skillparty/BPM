import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Package, 
  Eye, 
  BarChart3, 
  Users,
  Phone,
  Mail,
  Building2,
  MapPin,
  Home,
  FileText,
  User,
  Globe,
  Hash
} from 'lucide-react';
import ClientAnalytics from './ClientAnalytics';
import { useAuth } from '../context/AuthContext';

const Clients = () => {
  const { isColaborador } = useAuth();
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
          <h1 className="section-title">Clientes</h1>
          <p className="section-subtitle">Gestiona la información de tus clientes</p>
        </div>
        {activeTab === 'list' && (
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Nuevo Cliente</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-1.5">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            <Users className="w-4 h-4" strokeWidth={1.75} />
            <span>Lista de Clientes</span>
          </button>
          {!isColaborador() && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
              <span>Análisis</span>
            </button>
          )}
        </div>
      </div>

      {/* Vista de Análisis */}
      {activeTab === 'analytics' && <ClientAnalytics />}

      {/* Grid de Clientes */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => (
          <div key={client.phone} className="card group">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-slate-900 truncate">{client.name}</h3>
                {client.empresa && (
                  <div className="flex items-center space-x-1.5 mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" strokeWidth={1.75} />
                    <span className="text-sm text-primary-600 font-medium truncate">{client.empresa}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 ml-3">
                {client.tipo_cliente && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase ${
                    client.tipo_cliente === 'B2B' 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200/60' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                  }`}>
                    {client.tipo_cliente}
                  </span>
                )}
                {client.tipo_usuario && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${
                    client.tipo_usuario === 'Activo' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' 
                      : client.tipo_usuario === 'Prospecto' 
                        ? 'bg-amber-50 text-amber-600 border border-amber-200/60' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                  }`}>
                    {client.tipo_usuario}
                  </span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {(client.pais || client.ciudad) && (
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{[client.ciudad, client.departamento, client.pais].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Home className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{client.address}</span>
                </div>
              )}
            </div>

            {client.notes && (
              <p className="text-sm text-slate-500 mb-4 line-clamp-2 pl-5">
                {client.notes}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => handleViewOrders(client)}
                className="inline-flex items-center space-x-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                title="Ver pedidos"
              >
                <Package className="w-4 h-4" strokeWidth={1.75} />
                <span>{client.total_orders || 0} pedidos</span>
              </button>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(client)}
                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => handleDelete(client.phone)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-16 card">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-slate-500 font-medium">No se encontraron clientes</p>
            <p className="text-sm text-slate-400 mt-1">Agrega un nuevo cliente para comenzar</p>
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {editingClient ? 'Actualiza la información del cliente' : 'Completa los datos del nuevo cliente'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Información Básica */}
                <div className="bg-slate-50/80 p-5 rounded-xl space-y-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                    <h3 className="font-medium text-slate-900">Información Básica</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="label">Teléfono *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="input pl-10"
                          required
                          disabled={editingClient !== null}
                          placeholder="+591 12345678"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="name" className="label">Nombre *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="input pl-10"
                          required
                          placeholder="Nombre del cliente"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="label">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="input pl-10"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="tipo_cliente" className="label">Tipo de Cliente</label>
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
                <div className="bg-blue-50/50 p-5 rounded-xl space-y-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Building2 className="w-4 h-4 text-blue-500" strokeWidth={1.75} />
                    <h3 className="font-medium text-slate-900">Información Empresarial</h3>
                  </div>
                  
                  <div>
                    <label htmlFor="empresa" className="label">Empresa</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                      <input
                        type="text"
                        id="empresa"
                        value={formData.empresa}
                        onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                        className="input pl-10"
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="razon_social" className="label">Razón Social</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                        <input
                          type="text"
                          id="razon_social"
                          value={formData.razon_social}
                          onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
                          className="input pl-10"
                          placeholder="Razón social"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="nit" className="label">NIT</label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                        <input
                          type="text"
                          id="nit"
                          value={formData.nit}
                          onChange={(e) => setFormData({...formData, nit: e.target.value})}
                          className="input pl-10"
                          placeholder="Número de Identificación Tributaria"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ubicación */}
                <div className="bg-emerald-50/50 p-5 rounded-xl space-y-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="w-4 h-4 text-emerald-500" strokeWidth={1.75} />
                    <h3 className="font-medium text-slate-900">Ubicación</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="pais" className="label">País</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                        <input
                          type="text"
                          id="pais"
                          value={formData.pais}
                          onChange={(e) => setFormData({...formData, pais: e.target.value})}
                          className="input pl-10"
                          placeholder="Bolivia"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="departamento" className="label">Departamento</label>
                      <input
                        type="text"
                        id="departamento"
                        value={formData.departamento}
                        onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                        className="input"
                        placeholder="Santa Cruz"
                      />
                    </div>

                    <div>
                      <label htmlFor="ciudad" className="label">Ciudad</label>
                      <input
                        type="text"
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                        className="input"
                        placeholder="Santa Cruz"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="label">Dirección Completa</label>
                    <div className="relative">
                      <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                      <input
                        type="text"
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="input pl-10"
                        placeholder="Calle, número, zona, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label htmlFor="notes" className="label">Notas Adicionales</label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="input resize-none"
                    placeholder="Información adicional sobre el cliente..."
                  />
                </div>

                {editingClient && (
                  <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl">
                    <p className="text-sm text-amber-700">
                      <span className="font-medium">Tipo de Usuario:</span> {editingClient.tipo_usuario || 'Prospecto'}
                      <span className="text-xs text-amber-600 ml-2">(Automático según pedidos)</span>
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-5 border-t border-slate-200/60">
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
                    <Save className="w-4 h-4" strokeWidth={2} />
                    <span>{editingClient ? 'Actualizar' : 'Crear Cliente'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pedidos del Cliente */}
      {showOrdersModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Pedidos de {selectedClient?.name}
                  </h2>
                  <div className="flex items-center space-x-4 mt-1.5">
                    <div className="flex items-center space-x-1.5 text-sm text-slate-500">
                      <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>{selectedClient?.phone}</span>
                    </div>
                    {selectedClient?.empresa && (
                      <div className="flex items-center space-x-1.5 text-sm text-slate-500">
                        <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{selectedClient.empresa}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseOrdersModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Cargando pedidos...</p>
                  </div>
                </div>
              ) : selectedClientOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">Este cliente aún no tiene pedidos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Recibo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Tipo de Trabajo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Pago
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedClientOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              #{order.receipt_number}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-slate-900">{formatDate(order.order_date)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-slate-900">{order.work_type_name}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              {order.items_count} items
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-slate-900">
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
                  <div className="mt-6 bg-slate-50/80 p-5 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-slate-500 font-medium mb-1">Total de Pedidos</p>
                        <p className="text-3xl font-semibold text-slate-900">{selectedClientOrders.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-500 font-medium mb-1">Monto Total</p>
                        <p className="text-3xl font-semibold text-primary-600">
                          {formatCurrency(selectedClientOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0))}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-500 font-medium mb-1">Último Pedido</p>
                        <p className="text-xl font-semibold text-slate-900">
                          {selectedClientOrders.length > 0 ? formatDate(selectedClientOrders[0].order_date) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200/60 bg-slate-50/50">
              <button
                onClick={handleCloseOrdersModal}
                className="btn btn-secondary"
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
