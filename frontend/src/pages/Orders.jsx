import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Eye, Download, Tag, MessageCircle, Printer, CreditCard, Trash2 } from 'lucide-react';
import PartialPaymentsModal from '../components/PartialPaymentsModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const downloadPDF = async (orderId, type) => {
    try {
      let endpoint, fileName;
      
      if (type === 'receipt') {
        endpoint = `/orders/${orderId}/pdf`;
        fileName = `recibo_${orderId}.pdf`;
      } else if (type === 'label') {
        endpoint = `/orders/${orderId}/label`;
        fileName = `etiqueta_${orderId}.pdf`;
      }
      
      const response = await api.get(endpoint, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  const handleDelete = async (order) => {
    const confirmMessage = `¿Estás seguro de eliminar el pedido ${order.receipt_number}?\n\nCliente: ${order.client_name}\nTotal: Bs. ${parseFloat(order.total).toFixed(2)}\n\nEsta acción cambiará el estado del pedido a "Cancelado".`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await api.delete(`/orders/${order.id}`);
      toast.success('Pedido cancelado exitosamente');
      fetchOrders(); // Recargar lista
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      toast.error('Error al cancelar el pedido');
    }
  };

  const printPDF = (orderId, type) => {
    try {
      let endpoint;
      
      if (type === 'receipt') {
        endpoint = `/orders/${orderId}/pdf`;
      } else if (type === 'label') {
        endpoint = `/orders/${orderId}/label`;
      }
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      
      // Construir URL completa con token
      const baseURL = window.location.origin; // http://localhost:5089
      const fullURL = `${baseURL}/api${endpoint}`;
      
      // Abrir en nueva pestaña con token en header (usando fetch para incluir headers)
      const printWindow = window.open('', '_blank');
      
      fetch(fullURL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        printWindow.location.href = url;
      })
      .catch(error => {
        console.error('Error al cargar PDF:', error);
        printWindow.close();
        toast.error('Error al abrir el documento para imprimir');
      });
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast.error('Error al abrir el documento para imprimir');
    }
  };

  const sendWhatsAppQR = async (order) => {
    try {
      // Formatear mensaje para WhatsApp
      const mensaje = `Hola ${order.client_name}! 👋

Te comparto los datos de pago para tu pedido:

📋 *Detalles del Pedido*
• Pedido N°: ${order.receipt_number}
• Fecha: ${new Date(order.order_date).toLocaleDateString('es-BO')}
• Tipo de trabajo: ${order.work_type_name || 'N/A'}

💰 *Total a Pagar: Bs. ${parseFloat(order.total || 0).toFixed(2)}*

Te enviare el QR de pago en un momento para que puedas realizar la transferencia.

¡Gracias por tu preferencia! 🎨`;

      // Codificar mensaje para URL
      const mensajeCodificado = encodeURIComponent(mensaje);
      
      // Construir URL de WhatsApp
      const whatsappUrl = `https://wa.me/591${order.client_phone}?text=${mensajeCodificado}`;
      
      // Abrir WhatsApp en nueva ventana
      window.open(whatsappUrl, '_blank');
      
      toast.success('Abriendo WhatsApp');
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      toast.error('Error al abrir WhatsApp');
    }
  };

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.payment_status = paymentFilter;

      const response = await api.get('/orders', { params });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      'activo': 'badge-info',
      'completado': 'badge-success',
      'cancelado': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getPaymentBadge = (status) => {
    const badges = {
      'pagado': 'badge-success',
      'parcial': 'badge-warning',
      'pendiente': 'badge-danger'
    };
    return badges[status] || 'badge-danger';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">Gestiona todos los pedidos y recibos</p>
        </div>
        <Link to="/orders/new" className="btn btn-primary inline-flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Nuevo Pedido</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por cliente o número de recibo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los pagos</option>
              <option value="pagado">Pagado</option>
              <option value="parcial">Parcial</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recibo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-primary-600">
                      {order.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.receipt_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.client_name}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 font-medium">
                      {(() => {
                        const date = new Date(order.order_date + 'T12:00:00');
                        return date.toLocaleDateString('es-BO', { weekday: 'long' });
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const date = new Date(order.order_date + 'T12:00:00');
                        return date.toLocaleDateString('es-BO');
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.work_type_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      Bs. {parseFloat(order.total || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getPaymentBadge(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-900"
                        title="Ver detalles"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      
                      {/* Botón Gestionar Pagos - para pedidos pendientes o parciales */}
                      {(order.payment_status === 'pendiente' || order.payment_status === 'parcial') && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowPaymentsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Gestionar Pagos"
                        >
                          <CreditCard className="w-5 h-5" />
                        </button>
                      )}
                      
                      {/* Botón Imprimir Recibo */}
                      <button
                        onClick={() => printPDF(order.id, 'receipt')}
                        className="text-purple-600 hover:text-purple-900"
                        title="Imprimir Recibo"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      
                      {/* Botón Imprimir Ticket/Etiqueta - solo para DTF, SUBLIM, DTF+PL, SUB+PL */}
                      {order.work_type_id && [1, 2, 4, 5].includes(order.work_type_id) && (
                        <button
                          onClick={() => printPDF(order.id, 'label')}
                          className="text-orange-600 hover:text-orange-900"
                          title="Imprimir Ticket"
                        >
                          <Tag className="w-5 h-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => downloadPDF(order.id, 'receipt')}
                        className="text-green-600 hover:text-green-900"
                        title="Descargar Recibo"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => sendWhatsAppQR(order)}
                        className="text-green-600 hover:text-green-900"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      
                      {/* Botón Eliminar - solo para pedidos activos */}
                      {order.status === 'activo' && (
                        <button
                          onClick={() => handleDelete(order)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar Pedido"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron pedidos</p>
          </div>
        )}
      </div>

      {/* Modal de Pagos Parciales */}
      {showPaymentsModal && selectedOrder && (
        <PartialPaymentsModal
          orderId={selectedOrder.id}
          orderTotal={selectedOrder.total}
          onClose={() => {
            setShowPaymentsModal(false);
            setSelectedOrder(null);
          }}
          onPaymentAdded={() => {
            fetchOrders(); // Recargar lista de pedidos
          }}
        />
      )}
    </div>
  );
};

export default Orders;
