import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, DollarSign } from 'lucide-react';

const PartialPaymentsModal = ({ orderId, orderTotal, onClose, onPaymentAdded }) => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState({
    payment_type_id: '',
    bank_id: '',
    monto: '',
    numero_comprobante: '',
    notas: ''
  });

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes, paymentTypesRes, banksRes] = await Promise.all([
        api.get(`/partial-payments/orders/${orderId}`),
        api.get(`/partial-payments/orders/${orderId}/summary`),
        api.get('/payments/types'),
        api.get('/payments/banks')
      ]);

      setPayments(paymentsRes.data);
      setSummary(summaryRes.data);
      setPaymentTypes(paymentTypesRes.data); // Mostrar todos los tipos de pago
      setBanks(banksRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.payment_type_id || !formData.monto) {
      toast.error('Tipo de pago y monto son obligatorios');
      return;
    }

    try {
      await api.post(`/partial-payments/orders/${orderId}`, {
        ...formData,
        monto: parseFloat(formData.monto)
      });

      toast.success('Pago registrado exitosamente');
      setFormData({
        payment_type_id: '',
        bank_id: '',
        monto: '',
        numero_comprobante: '',
        notas: ''
      });
      setShowAddForm(false);
      fetchData();
      if (onPaymentAdded) onPaymentAdded();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error(error.response?.data?.message || 'Error al registrar el pago');
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('¿Estás seguro de eliminar este pago?')) {
      return;
    }

    try {
      await api.delete(`/partial-payments/${paymentId}`);
      toast.success('Pago eliminado exitosamente');
      fetchData();
      if (onPaymentAdded) onPaymentAdded();
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      toast.error('Error al eliminar el pago');
    }
  };

  const selectedPaymentType = paymentTypes.find(pt => pt.id === parseInt(formData.payment_type_id));
  const requiresBank = selectedPaymentType?.code === 'QR' || selectedPaymentType?.code === 'TRANSFER';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Gestionar Pagos del Pedido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Resumen */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Total del Pedido</p>
                <p className="text-2xl font-bold text-blue-900">Bs. {parseFloat(summary.total || 0).toFixed(2)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Monto Pagado</p>
                <p className="text-2xl font-bold text-green-900">Bs. {parseFloat(summary.monto_pagado || 0).toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">Saldo Pendiente</p>
                <p className="text-2xl font-bold text-orange-900">Bs. {parseFloat(summary.saldo_pendiente || 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Botón Agregar Pago */}
          {!showAddForm && parseFloat(summary?.saldo_pendiente || 0) > 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary mb-6 w-full"
            >
              <Plus className="w-5 h-5" />
              Agregar Pago
            </button>
          )}

          {/* Formulario Agregar Pago */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Nuevo Pago</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Pago *
                  </label>
                  <select
                    value={formData.payment_type_id}
                    onChange={(e) => setFormData({ ...formData, payment_type_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {paymentTypes.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </div>

                {requiresBank && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banco *
                    </label>
                    <select
                      value={formData.bank_id}
                      onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
                      className="input"
                      required={requiresBank}
                    >
                      <option value="">Seleccionar...</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto (Bs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={parseFloat(summary?.saldo_pendiente || 0)}
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Comprobante
                  </label>
                  <input
                    type="text"
                    value={formData.numero_comprobante}
                    onChange={(e) => setFormData({ ...formData, numero_comprobante: e.target.value })}
                    className="input"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="input"
                  rows="2"
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary flex-1">
                  Guardar Pago
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista de Pagos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Historial de Pagos ({payments.length})</h3>
            
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando...</p>
            ) : payments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay pagos registrados</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="text-lg font-bold text-gray-900">
                            Bs. {parseFloat(payment.monto).toFixed(2)}
                          </span>
                          <span className="badge badge-success">
                            {payment.payment_type_name}
                          </span>
                          {payment.bank_name && (
                            <span className="text-sm text-gray-600">
                              {payment.bank_name}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Fecha:</strong> {new Date(payment.fecha_pago).toLocaleString('es-BO')}
                          </p>
                          {payment.numero_comprobante && (
                            <p>
                              <strong>Comprobante:</strong> {payment.numero_comprobante}
                            </p>
                          )}
                          {payment.notas && (
                            <p>
                              <strong>Notas:</strong> {payment.notas}
                            </p>
                          )}
                          {payment.usuario_name && (
                            <p>
                              <strong>Registrado por:</strong> {payment.usuario_name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(payment.id)}
                        className="text-red-600 hover:text-red-900 p-2"
                        title="Eliminar pago"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartialPaymentsModal;
