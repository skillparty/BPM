import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Edit, Trash2, Calendar, User, DollarSign, Tag, MessageCircle } from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      toast.error('Error al cargar el pedido');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de cancelar este pedido?')) {
      return;
    }

    try {
      await api.delete(`/orders/${id}`);
      toast.success('Pedido cancelado exitosamente');
      navigate('/orders');
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      toast.error('Error al cancelar el pedido');
    }
  };

  const downloadPDF = async (type) => {
    try {
      let endpoint, fileName;
      
      if (type === 'receipt') {
        endpoint = `/orders/${id}/pdf`;
        fileName = `recibo_${id}.pdf`;
      } else if (type === 'label') {
        endpoint = `/orders/${id}/label`;
        fileName = `etiqueta_${id}.pdf`;
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

  const sendWhatsAppQR = async () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pedido no encontrado</p>
      </div>
    );
  }

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Recibo #{order.receipt_number}
            </h1>
            <p className="text-gray-500 mt-1">Detalles del pedido</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => downloadPDF('receipt')}
            className="btn btn-secondary inline-flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Recibo</span>
          </button>
          {/* Etiqueta solo para pedidos con impresión (DTF, SUBLIM, DTF+PL, SUB+PL) */}
          {order.work_type_id && [1, 2, 4, 5].includes(order.work_type_id) && (
            <button
              onClick={() => downloadPDF('label')}
              className="btn btn-secondary inline-flex items-center space-x-2"
            >
              <Tag className="w-4 h-4" />
              <span>Etiqueta</span>
            </button>
          )}
          <button
            onClick={sendWhatsAppQR}
            className="btn btn-secondary inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar WhatsApp</span>
          </button>
          {order.status !== 'cancelado' && (
            <>
              <Link
                to={`/orders/${id}/edit`}
                className="btn btn-primary inline-flex items-center space-x-2"
              >
                <Edit className="w-5 h-5" />
                <span>Editar</span>
              </Link>
              <button
                onClick={handleDelete}
                className="btn btn-danger inline-flex items-center space-x-2"
              >
                <Trash2 className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Cliente</h3>
          </div>
          <p className="text-lg font-medium text-gray-900">{order.client_name}</p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Fecha</h3>
          </div>
          <p className="text-lg font-medium text-gray-900">
            {new Date(order.order_date).toLocaleDateString('es-BO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Bs. {parseFloat(order.total || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Detalles del Pedido */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Pedido</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Tipo de Trabajo</p>
            <p className="font-medium text-gray-900">{order.work_type_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <span className={`badge ${getStatusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estado de Pago</p>
            <span className={`badge ${getPaymentBadge(order.payment_status)}`}>
              {order.payment_status}
            </span>
          </div>
          {order.payment_type_name && (
            <div>
              <p className="text-sm text-gray-600">Tipo de Pago</p>
              <p className="font-medium text-gray-900">{order.payment_type_name}</p>
            </div>
          )}
          {order.bank_name && (
            <div>
              <p className="text-sm text-gray-600">Banco</p>
              <p className="font-medium text-gray-900">{order.bank_name}</p>
            </div>
          )}
        </div>

        {order.notes && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Notas</p>
            <p className="text-gray-900">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items del Pedido</h3>
        
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900">Item #{item.item_number}</h4>
                <span className="text-lg font-bold text-gray-900">
                  Bs. {parseFloat(item.total).toFixed(2)}
                </span>
              </div>

              <div className="space-y-3">
                {/* Impresión */}
                {parseFloat(item.impresion_metraje) > 0 && (
                  <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">Impresión</span>
                      <span className="font-semibold text-blue-600">
                        Bs. {parseFloat(item.impresion_subtotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {parseFloat(item.impresion_metraje).toFixed(2)} metros × Bs. {parseFloat(item.impresion_costo).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Planchado */}
                {parseFloat(item.planchado_cantidad) > 0 && (
                  <div className="bg-white p-3 rounded border-l-4 border-green-500">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">Planchado</span>
                      <span className="font-semibold text-green-600">
                        Bs. {parseFloat(item.planchado_subtotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {parseFloat(item.planchado_cantidad)} unidades × Bs. {parseFloat(item.planchado_costo).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Insignias Texturizadas */}
                {parseFloat(item.insignia_cantidad) > 0 && (
                  <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">Insignias Texturizadas</span>
                      <span className="font-semibold text-purple-600">
                        Bs. {parseFloat(item.insignia_subtotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {parseFloat(item.insignia_cantidad)} unidades × Bs. {parseFloat(item.insignia_costo).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-gray-300">
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">TOTAL DEL PEDIDO</p>
              <p className="text-3xl font-bold text-gray-900">
                Bs. {parseFloat(order.total || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code */}
      {order.qr_code && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Código QR</h3>
          <img 
            src={order.qr_code} 
            alt="QR Code" 
            className="w-48 h-48 mx-auto"
          />
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
