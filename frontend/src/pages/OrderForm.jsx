import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, X } from 'lucide-react';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [workTypes, setWorkTypes] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [banks, setBanks] = useState([]);

  const [formData, setFormData] = useState({
    client_name: '',
    client_id: null,
    order_date: new Date().toISOString().split('T')[0],
    work_type_id: '',
    description: '',
    payment_type_id: '',
    bank_id: '',
    payment_status: 'pendiente',
    notes: '',
    items: [{
      // Módulo Impresión
      useImpresion: false,
      impresion_metraje: 0,
      impresion_costo: 0,
      impresion_subtotal: 0,
      // Módulo Planchado
      usePlanchado: false,
      planchado_cantidad: 0,
      planchado_costo: 0,
      planchado_subtotal: 0,
      // Módulo Insignias
      useInsignia: false,
      insignia_cantidad: 0,
      insignia_costo: 0,
      insignia_subtotal: 0,
      // Total
      total: 0
    }]
  });

  useEffect(() => {
    fetchCatalogs();
    if (isEdit) {
      fetchOrder();
    }
  }, [id]);

  const fetchCatalogs = async () => {
    try {
      const [workTypesRes, paymentTypesRes, banksRes] = await Promise.all([
        api.get('/payments/work-types'),
        api.get('/payments/types'),
        api.get('/payments/banks')
      ]);

      setWorkTypes(workTypesRes.data);
      setPaymentTypes(paymentTypesRes.data);
      setBanks(banksRes.data);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      toast.error('Error al cargar los datos del formulario');
    }
  };

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      const order = response.data;
      
      setFormData({
        client_name: order.client_name,
        client_id: order.client_id,
        order_date: new Date(order.order_date).toISOString().split('T')[0],
        work_type_id: order.work_type_id || '',
        description: order.description || '',
        payment_type_id: order.payment_type_id || '',
        bank_id: order.bank_id || '',
        payment_status: order.payment_status,
        notes: order.notes || '',
        items: order.items || []
      });
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      toast.error('Error al cargar el pedido');
      navigate('/orders');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Calcular subtotales según el campo modificado
    if (field === 'impresion_metraje' || field === 'impresion_costo') {
      const metraje = parseFloat(newItems[index].impresion_metraje) || 0;
      const costo = parseFloat(newItems[index].impresion_costo) || 0;
      newItems[index].impresion_subtotal = metraje * costo;
    }
    
    if (field === 'planchado_cantidad' || field === 'planchado_costo') {
      const cantidad = parseFloat(newItems[index].planchado_cantidad) || 0;
      const costo = parseFloat(newItems[index].planchado_costo) || 0;
      newItems[index].planchado_subtotal = cantidad * costo;
    }
    
    if (field === 'insignia_cantidad' || field === 'insignia_costo') {
      const cantidad = parseFloat(newItems[index].insignia_cantidad) || 0;
      const costo = parseFloat(newItems[index].insignia_costo) || 0;
      newItems[index].insignia_subtotal = cantidad * costo;
    }

    // Calcular total del item (suma de los 3 subtotales)
    const impresionSubtotal = newItems[index].useImpresion ? (parseFloat(newItems[index].impresion_subtotal) || 0) : 0;
    const planchadoSubtotal = newItems[index].usePlanchado ? (parseFloat(newItems[index].planchado_subtotal) || 0) : 0;
    const insigniaSubtotal = newItems[index].useInsignia ? (parseFloat(newItems[index].insignia_subtotal) || 0) : 0;
    
    newItems[index].total = impresionSubtotal + planchadoSubtotal + insigniaSubtotal;

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        useImpresion: false,
        impresion_metraje: 0,
        impresion_costo: 0,
        impresion_subtotal: 0,
        usePlanchado: false,
        planchado_cantidad: 0,
        planchado_costo: 0,
        planchado_subtotal: 0,
        useInsignia: false,
        insignia_cantidad: 0,
        insignia_costo: 0,
        insignia_subtotal: 0,
        total: 0
      }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.error('Debe haber al menos un item');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_name) {
      toast.error('El nombre del cliente es requerido');
      return;
    }

    if (!formData.work_type_id) {
      toast.error('El tipo de trabajo es requerido');
      return;
    }

    if (formData.items.some(item => !item.useImpresion && !item.usePlanchado && !item.useInsignia)) {
      toast.error('Cada item debe tener al menos un módulo seleccionado');
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/orders/${id}`, formData);
        toast.success('Pedido actualizado exitosamente');
      } else {
        await api.post('/orders', formData);
        toast.success('Pedido creado exitosamente');
      }
      navigate('/orders');
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? 'Modifica los datos del pedido' : 'Completa los datos del nuevo pedido'}
          </p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="btn btn-secondary inline-flex items-center space-x-2"
        >
          <X className="w-5 h-5" />
          <span>Cancelar</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Cliente */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client_name" className="label">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="order_date" className="label">
                Fecha
              </label>
              <input
                type="date"
                id="order_date"
                name="order_date"
                value={formData.order_date}
                onChange={handleInputChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Detalles del Trabajo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Trabajo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="work_type_id" className="label">
                Tipo de Trabajo *
              </label>
              <select
                id="work_type_id"
                name="work_type_id"
                value={formData.work_type_id}
                onChange={handleInputChange}
                className="input"
                required
              >
                <option value="">Seleccionar...</option>
                {workTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="label">
                Descripción
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input"
                placeholder="Descripción general del pedido"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items del Pedido</h3>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-secondary btn-sm inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Item</span>
            </button>
          </div>

          <div className="space-y-6">
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900">Item #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                    disabled={formData.items.length === 1}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Módulo Impresión */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={item.useImpresion}
                      onChange={(e) => handleItemChange(index, 'useImpresion', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="font-medium text-gray-900">Impresión</span>
                  </label>
                  
                  {item.useImpresion && (
                    <div className="grid grid-cols-3 gap-3 ml-6">
                      <div>
                        <label className="text-xs text-gray-600">Metraje</label>
                        <input
                          type="number"
                          value={item.impresion_metraje}
                          onChange={(e) => handleItemChange(index, 'impresion_metraje', e.target.value)}
                          className="input"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Costo/metro (Bs)</label>
                        <input
                          type="number"
                          value={item.impresion_costo}
                          onChange={(e) => handleItemChange(index, 'impresion_costo', e.target.value)}
                          className="input"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Subtotal</label>
                        <input
                          type="number"
                          value={item.impresion_subtotal.toFixed(2)}
                          className="input bg-white"
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Módulo Planchado */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={item.usePlanchado}
                      onChange={(e) => handleItemChange(index, 'usePlanchado', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="font-medium text-gray-900">Planchado</span>
                  </label>
                  
                  {item.usePlanchado && (
                    <div className="grid grid-cols-3 gap-3 ml-6">
                      <div>
                        <label className="text-xs text-gray-600">Cantidad</label>
                        <input
                          type="number"
                          value={item.planchado_cantidad}
                          onChange={(e) => handleItemChange(index, 'planchado_cantidad', e.target.value)}
                          className="input"
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Costo/unidad (Bs)</label>
                        <input
                          type="number"
                          value={item.planchado_costo}
                          onChange={(e) => handleItemChange(index, 'planchado_costo', e.target.value)}
                          className="input"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Subtotal</label>
                        <input
                          type="number"
                          value={item.planchado_subtotal.toFixed(2)}
                          className="input bg-white"
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Módulo Insignias Texturizadas */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={item.useInsignia}
                      onChange={(e) => handleItemChange(index, 'useInsignia', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="font-medium text-gray-900">Insignias Texturizadas</span>
                  </label>
                  
                  {item.useInsignia && (
                    <div className="grid grid-cols-3 gap-3 ml-6">
                      <div>
                        <label className="text-xs text-gray-600">Cantidad</label>
                        <input
                          type="number"
                          value={item.insignia_cantidad}
                          onChange={(e) => handleItemChange(index, 'insignia_cantidad', e.target.value)}
                          className="input"
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Costo/unidad (Bs)</label>
                        <input
                          type="number"
                          value={item.insignia_costo}
                          onChange={(e) => handleItemChange(index, 'insignia_costo', e.target.value)}
                          className="input"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Subtotal</label>
                        <input
                          type="number"
                          value={item.insignia_subtotal.toFixed(2)}
                          className="input bg-white"
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Total del Item */}
                <div className="flex justify-end pt-3 border-t border-gray-300">
                  <div className="text-right">
                    <span className="text-sm text-gray-600">Total Item:</span>
                    <span className="ml-2 text-lg font-bold text-gray-900">
                      Bs. {item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  Bs. {calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de Pago */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="payment_type_id" className="label">
                Tipo de Pago
              </label>
              <select
                id="payment_type_id"
                name="payment_type_id"
                value={formData.payment_type_id}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Seleccionar...</option>
                {paymentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bank_id" className="label">
                Banco
              </label>
              <select
                id="bank_id"
                name="bank_id"
                value={formData.bank_id}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Seleccionar...</option>
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="payment_status" className="label">
                Estado de Pago
              </label>
              <select
                id="payment_status"
                name="payment_status"
                value={formData.payment_status}
                onChange={handleInputChange}
                className="input"
              >
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Parcial</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="notes" className="label">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="input"
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary inline-flex items-center space-x-2"
            disabled={loading}
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Pedido'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
