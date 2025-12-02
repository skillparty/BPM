import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, X, Clock, User } from 'lucide-react';
import SmartAutocomplete from '../components/SmartAutocomplete';
import { AutosaveIndicator } from '../components/FormHelpers';
import { useAutosave } from '../hooks/useFormValidation';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [workTypes, setWorkTypes] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [banks, setBanks] = useState([]);
  const [clients, setClients] = useState([]);
  const [rollos, setRollos] = useState([]);
  const [rolloSeleccionado, setRolloSeleccionado] = useState(null);
  const [isSublimacion, setIsSublimacion] = useState(false);
  const [requiereSeleccionRollo, setRequiereSeleccionRollo] = useState(false);
  const [tipoRollo, setTipoRollo] = useState('DTF');
  const [metrajeTotalRequerido, setMetrajeTotalRequerido] = useState(0);
  const [alertaMetraje, setAlertaMetraje] = useState(null);
  const [modulosHabilitados, setModulosHabilitados] = useState({
    impresion: true,
    planchado: true,
    insignia: true
  });

  // Calcular día inicial
  const initialDate = new Date();
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const initialDay = days[initialDate.getDay()];

  const [clientSearch, setClientSearch] = useState('');

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: null,
    order_date: initialDate.toISOString().split('T')[0],
    order_day: initialDay,
    work_type_id: '',
    numero_rollo: '',
    description: '',
    payment_type_id: '',
    bank_id: '',
    payment_status: 'pendiente',
    notes: '',
    items: [{
      // Módulo Impresión
      useImpresion: false,
      impresion_metraje: '',
      impresion_costo: 0,
      impresion_subtotal: 0,
      // Módulo Planchado
      usePlanchado: false,
      planchado_cantidad: '',
      planchado_costo: '',
      planchado_subtotal: 0,
      // Módulo Insignias
      useInsignia: false,
      insignia_cantidad: '',
      insignia_costo: '',
      insignia_subtotal: 0,
      // Total
      total: 0
    }]
  });

  // Autosave para borradores (solo en modo crear)
  const { lastSaved, isSaving, getDraft, clearDraft, hasDraft } = useAutosave(
    'order_draft',
    isEdit ? null : formData,
    5000
  );

  // Restaurar borrador al cargar
  useEffect(() => {
    if (!isEdit && hasDraft()) {
      const draft = getDraft();
      if (draft && draft.client_name) {
        // Mostrar opción de restaurar
      }
    }
  }, []);

  const handleRestoreDraft = () => {
    const draft = getDraft();
    if (draft) {
      setFormData(draft);
      setClientSearch(draft.client_name || '');
      toast.success('Borrador restaurado');
    }
  };

  useEffect(() => {
    fetchCatalogs();
    if (isEdit) {
      fetchOrder();
    }
  }, [id]);

  const fetchCatalogs = async () => {
    try {
      const [workTypesRes, paymentTypesRes, banksRes, clientsRes] = await Promise.all([
        api.get('/payments/work-types'),
        api.get('/payments/types'),
        api.get('/payments/banks'),
        api.get('/clients')
      ]);

      setWorkTypes(workTypesRes.data);
      setPaymentTypes(paymentTypesRes.data);
      setBanks(banksRes.data);
      setClients(clientsRes.data.clients || []);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      toast.error('Error al cargar los datos del formulario');
    }
  };

  // Función para cargar rollos según el tipo de trabajo
  const fetchRollosPorTipo = async (tipo) => {
    try {
      const response = await api.get(`/rollos?tipo=${tipo}`);
      setRollos(response.data || []);
    } catch (error) {
      console.error('Error al cargar rollos:', error);
      setRollos([]);
    }
  };

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      const order = response.data;
      
      // El pedido debe tener un client_phone válido
      
      setFormData({
        client_name: order.client_name,
        client_phone: order.client_phone,
        order_date: new Date(order.order_date).toISOString().split('T')[0],
        order_day: order.order_day || '',
        work_type_id: order.work_type_id || '',
        numero_rollo: order.numero_rollo || '',
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

  // Calcular metraje total requerido
  useEffect(() => {
    if (isSublimacion) {
      const total = formData.items.reduce((sum, item) => {
        if (item.useImpresion) {
          return sum + (parseFloat(item.impresion_metraje) || 0);
        }
        return sum;
      }, 0);
      setMetrajeTotalRequerido(total);
      if (requiereSeleccionRollo) {
        verificarDisponibilidadRollo(formData.numero_rollo, total);
      }
    }
  }, [formData.items, isSublimacion, requiereSeleccionRollo, formData.numero_rollo]);

  const verificarDisponibilidadRollo = async (numeroRollo, metrajRequerido) => {
    if (!numeroRollo || !requiereSeleccionRollo || metrajRequerido === 0) {
      setAlertaMetraje(null);
      return;
    }

    try {
      const response = await api.post('/rollos/verificar-disponibilidad', {
        numero_rollo: parseInt(numeroRollo),
        metraje_requerido: metrajRequerido
      });

      if (!response.data.disponible) {
        setAlertaMetraje({
          tipo: 'error',
          mensaje: response.data.mensaje
        });
      } else if (response.data.diferencia < 10) {
        setAlertaMetraje({
          tipo: 'warning',
          mensaje: `⚠️ Advertencia: Solo quedarán ${response.data.diferencia.toFixed(2)}m disponibles en el rollo después de este pedido`
        });
      } else {
        setAlertaMetraje({
          tipo: 'success',
          mensaje: `✅ Rollo ${numeroRollo} tiene suficiente metraje (${response.data.metraje_disponible}m disponibles)`
        });
      }
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia la fecha, calcular el día automáticamente
    if (name === 'order_date') {
      const date = new Date(value + 'T00:00:00');
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = days[date.getDay()];
      setFormData(prev => ({ ...prev, order_date: value, order_day: dayName }));
    } else if (name === 'work_type_id') {
      // Verificar el tipo de trabajo y configurar módulos habilitados
      const selectedWorkType = workTypes.find(wt => wt.id === parseInt(value));
      
      if (selectedWorkType) {
        const workTypeName = selectedWorkType.name.toUpperCase();
        const workTypeCode = selectedWorkType.code;
        
        // Verificar si requiere control de rollos: DTF, DTF+, DTF+PL, SUBLIM, SUB+PL
        const requiereRollo = ['1', '2', '4', '5', '8'].includes(workTypeCode) || 
                             ['DTF', 'DTF+', 'DTF+PL', 'SUBLIM', 'SUB+PL'].includes(workTypeName);
        setIsSublimacion(requiereRollo);
        
        // Determinar tipo de rollo - TODOS usan descuento automático desde Rollo 1
        let tipoRolloActual = 'DTF';
        
        if (requiereRollo) {
          // SUBLIM y SUB+PL usan rollos SUBLIM con descuento automático
          if (['SUBLIM', 'SUB+PL'].includes(workTypeName) || ['2', '5'].includes(workTypeCode)) {
            tipoRolloActual = 'SUBLIM';
          } 
          // DTF, DTF+, DTF+PL usan rollos DTF con descuento automático
          else if (['DTF', 'DTF+', 'DTF+PL'].includes(workTypeName) || ['1', '4', '8'].includes(workTypeCode)) {
            tipoRolloActual = 'DTF';
          }
        }
        
        setTipoRollo(tipoRolloActual);
        setRequiereSeleccionRollo(false); // Ninguno requiere selección manual
        setRollos([]); // No necesitan lista de rollos
        
        // Determinar qué módulos están habilitados según el tipo de trabajo
        let nuevosModulos = { impresion: true, planchado: true, insignia: true };
        
        // DTF (1), DTF+ (8), SUBLIM (2), DTF+PL (4), SUB+PL (5) → Solo Impresión y Planchado
        if (['DTF', 'DTF+', 'SUBLIM', 'DTF+PL', 'SUB+PL'].includes(workTypeName) || 
            ['1', '2', '4', '5', '8'].includes(workTypeCode)) {
          nuevosModulos = { impresion: true, planchado: true, insignia: false };
        }
        // INSIG-T (6), INS+PL (7) → Solo Insignias y Planchado
        else if (['INSIG-T', 'INS+PL'].includes(workTypeName) || 
                 ['6', '7'].includes(workTypeCode)) {
          nuevosModulos = { impresion: false, planchado: true, insignia: true };
        }
        // PLANCH (3) → Solo Planchado
        else if (workTypeName === 'PLANCH' || workTypeCode === '3') {
          nuevosModulos = { impresion: false, planchado: true, insignia: false };
        }
        
        setModulosHabilitados(nuevosModulos);
        
        // Limpiar items que no correspondan al tipo de trabajo
        const itemsActualizados = formData.items.map(item => ({
          ...item,
          // Deshabilitar impresión si no está permitida
          useImpresion: nuevosModulos.impresion ? item.useImpresion : false,
          impresion_metraje: nuevosModulos.impresion ? item.impresion_metraje : 0,
          impresion_costo: nuevosModulos.impresion ? item.impresion_costo : 0,
          impresion_subtotal: nuevosModulos.impresion ? item.impresion_subtotal : 0,
          // Deshabilitar planchado si no está permitido
          usePlanchado: nuevosModulos.planchado ? item.usePlanchado : false,
          planchado_cantidad: nuevosModulos.planchado ? item.planchado_cantidad : 0,
          planchado_costo: nuevosModulos.planchado ? item.planchado_costo : 0,
          planchado_subtotal: nuevosModulos.planchado ? item.planchado_subtotal : 0,
          // Deshabilitar insignias si no están permitidas
          useInsignia: nuevosModulos.insignia ? item.useInsignia : false,
          insignia_cantidad: nuevosModulos.insignia ? item.insignia_cantidad : 0,
          insignia_costo: nuevosModulos.insignia ? item.insignia_costo : 0,
          insignia_subtotal: nuevosModulos.insignia ? item.insignia_subtotal : 0
        }));
        
        setFormData(prev => ({ ...prev, [name]: value, items: itemsActualizados }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'numero_rollo') {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (value) {
        const rollo = rollos.find(r => r.numero_rollo === parseInt(value));
        setRolloSeleccionado(rollo);
      } else {
        setRolloSeleccionado(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
        // Solo habilitar módulos permitidos por el tipo de trabajo
        useImpresion: false,
        impresion_metraje: '',
        impresion_costo: 0,
        impresion_subtotal: 0,
        usePlanchado: false,
        planchado_cantidad: '',
        planchado_costo: '',
        planchado_subtotal: 0,
        useInsignia: false,
        insignia_cantidad: '',
        insignia_costo: '',
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

    // Validar que cada item tenga al menos un módulo habilitado seleccionado
    const itemsInvalidos = formData.items.some(item => {
      const tieneModuloSeleccionado = 
        (modulosHabilitados.impresion && item.useImpresion) ||
        (modulosHabilitados.planchado && item.usePlanchado) ||
        (modulosHabilitados.insignia && item.useInsignia);
      return !tieneModuloSeleccionado;
    });

    if (itemsInvalidos) {
      toast.error('Cada item debe tener al menos un módulo seleccionado');
      return;
    }

    // Validación especial para trabajos que requieren rollo
    if (isSublimacion) {
      if (metrajeTotalRequerido === 0) {
        toast.error('Debes ingresar el metraje de impresión en al menos un ítem');
        return;
      }
    }

    // Confirmar si el rollo quedará con poco metraje
    if (alertaMetraje && alertaMetraje.tipo === 'warning') {
      const confirmar = window.confirm(
        `${alertaMetraje.mensaje}\n\n¿Deseas continuar con este pedido?`
      );
      if (!confirmar) {
        return;
      }
    }

    setLoading(true);

    try {
      let orderResponse;
      
      if (isEdit) {
        orderResponse = await api.put(`/orders/${id}`, formData);
        toast.success('Pedido actualizado exitosamente');
      } else {
        orderResponse = await api.post('/orders', formData);
        
        // Descontar metraje del rollo automáticamente
        if (isSublimacion && metrajeTotalRequerido > 0) {
          try {
            const descuentoResponse = await api.post('/rollos/descontar-automatico', {
              tipo: tipoRollo,
              metraje: metrajeTotalRequerido,
              order_id: orderResponse.data.order.id,
              client_name: formData.client_name
            });
            
            toast.success(
              `Pedido creado exitosamente. ${metrajeTotalRequerido.toFixed(2)}m descontados del Rollo ${tipoRollo} ${descuentoResponse.data.numero_rollo}`,
              { duration: 4000 }
            );
          } catch (rolloError) {
            console.error('Error al descontar metraje:', rolloError);
            toast.error('Pedido creado pero hubo un error al descontar el metraje del rollo');
          }
        } else {
          toast.success('Pedido creado exitosamente');
        }
        
        // Limpiar borrador al crear exitosamente
        clearDraft();
      }
      
      navigate('/orders');
    } catch (error) {
      console.error('Error al guardar pedido:', error.response?.data || error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al guardar el pedido';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h1>
          <p className="text-slate-500 mt-1">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Información del Cliente</h3>
            {!isEdit && (
              <AutosaveIndicator
                lastSaved={lastSaved}
                isSaving={isSaving}
                hasDraft={hasDraft()}
                onRestore={handleRestoreDraft}
                onClear={clearDraft}
              />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Buscar Cliente *
              </label>
              <SmartAutocomplete
                value={clientSearch}
                onChange={setClientSearch}
                onSelect={(client) => {
                  if (client) {
                    setFormData(prev => ({
                      ...prev,
                      client_phone: client.phone,
                      client_name: client.name
                    }));
                    setClientSearch(client.name);
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      client_phone: null,
                      client_name: ''
                    }));
                  }
                }}
                options={clients}
                placeholder="Escribe nombre o teléfono..."
                displayField="name"
                secondaryField="phone"
                icon={User}
                required
                minChars={1}
                maxResults={8}
              />
              <p className="mt-1 text-xs text-slate-500">
                Escribe para buscar. Si no existe, créalo desde el módulo de Clientes.
              </p>
            </div>

            <div>
              <label htmlFor="client_phone" className="label">
                Teléfono del Cliente
              </label>
              <input
                type="text"
                id="client_phone"
                value={formData.client_phone || ''}
                className="input bg-slate-50"
                readOnly
                disabled
                placeholder="Se autocompleta al seleccionar"
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

            <div>
              <label htmlFor="order_day" className="label">
                Día
              </label>
              <input
                type="text"
                id="order_day"
                name="order_day"
                value={formData.order_day}
                className="input bg-slate-50"
                readOnly
                placeholder="Se calculará automáticamente"
              />
            </div>
          </div>
        </div>

        {/* Detalles del Trabajo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Detalles del Trabajo</h3>
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
              
              {/* Indicador de módulos habilitados */}
              {formData.work_type_id && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs font-medium text-slate-700 mb-1">Módulos disponibles:</p>
                  <div className="flex flex-wrap gap-2">
                    {modulosHabilitados.impresion && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ Impresión
                      </span>
                    )}
                    {modulosHabilitados.planchado && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Planchado
                      </span>
                    )}
                    {modulosHabilitados.insignia && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ✓ Insignias
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mensaje informativo para descuento automático */}
            {isSublimacion && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">✓ Descuento automático:</span> El metraje se descontará automáticamente del primer rollo {tipoRollo} disponible comenzando desde el Rollo 1.
                </p>
                {metrajeTotalRequerido > 0 && (
                  <p className="text-sm text-blue-900 mt-2 font-medium">
                    📏 Metraje requerido: {metrajeTotalRequerido.toFixed(2)}m
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Items del Pedido</h3>
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
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-slate-900">Item #{index + 1}</h4>
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
                {modulosHabilitados.impresion && (
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={item.useImpresion}
                        onChange={(e) => handleItemChange(index, 'useImpresion', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                      />
                      <span className="font-medium text-slate-900">Impresión</span>
                    </label>
                  
                    {item.useImpresion && (
                      <div className="grid grid-cols-3 gap-3 ml-6">
                        <div>
                          <label className="text-xs text-slate-600">Metraje</label>
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
                          <label className="text-xs text-slate-600">Costo/metro (Bs)</label>
                          <select
                            value={item.impresion_costo}
                            onChange={(e) => handleItemChange(index, 'impresion_costo', e.target.value)}
                            className="input"
                          >
                            <option value="0">Seleccionar...</option>
                            <option value="110">110 Bs/m</option>
                            <option value="120">120 Bs/m</option>
                            <option value="130">130 Bs/m</option>
                            <option value="140">140 Bs/m</option>
                            <option value="55">55 Bs/m</option>
                            <option value="30">30 Bs/m</option>
                            <option value="26.5">26.5 Bs/m</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">Subtotal</label>
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
                )}

                {/* Módulo Planchado */}
                {modulosHabilitados.planchado && (
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={item.usePlanchado}
                        onChange={(e) => handleItemChange(index, 'usePlanchado', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                      />
                      <span className="font-medium text-slate-900">Planchado</span>
                    </label>
                  
                    {item.usePlanchado && (
                      <div className="grid grid-cols-3 gap-3 ml-6">
                        <div>
                          <label className="text-xs text-slate-600">Cantidad</label>
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
                          <label className="text-xs text-slate-600">Costo/unidad (Bs)</label>
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
                          <label className="text-xs text-slate-600">Subtotal</label>
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
                )}

                {/* Módulo Insignias Texturizadas */}
                {modulosHabilitados.insignia && (
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={item.useInsignia}
                        onChange={(e) => handleItemChange(index, 'useInsignia', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                      />
                      <span className="font-medium text-slate-900">Insignias Texturizadas</span>
                    </label>
                  
                    {item.useInsignia && (
                      <div className="grid grid-cols-3 gap-3 ml-6">
                        <div>
                          <label className="text-xs text-slate-600">Cantidad</label>
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
                          <label className="text-xs text-slate-600">Costo/unidad (Bs)</label>
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
                          <label className="text-xs text-slate-600">Subtotal</label>
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
                )}

                {/* Total del Item */}
                <div className="flex justify-end pt-3 border-t border-slate-300">
                  <div className="text-right">
                    <span className="text-sm text-slate-600">Total Item:</span>
                    <span className="ml-2 text-lg font-bold text-slate-900">
                      Bs. {item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  Bs. {calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de Pago */}
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de Pago</h3>
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
