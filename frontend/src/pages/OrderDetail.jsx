import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Edit, Trash2, Calendar, User, DollarSign } from 'lucide-react';

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
          <a
            href={`/api/orders/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary inline-flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Descargar PDF</span>
          </a>
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
            Bs. {order.total.toFixed(2)}
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
            <p className="text-sm text-gray-600">Descripción</p>
            <p className="font-medium text-gray-900">{order.description || '-'}</p>
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
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Precio Unitario
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.item_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    Bs. {parseFloat(item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    Bs. {parseFloat(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="4" className="px-6 py-4 text-right font-semibold text-gray-900">
                  Total:
                </td>
                <td className="px-6 py-4 text-right font-bold text-xl text-gray-900">
                  Bs. {order.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
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
