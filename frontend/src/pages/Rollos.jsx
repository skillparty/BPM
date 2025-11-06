import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, Edit2, RotateCcw, History, X, Save } from 'lucide-react';

const Rollos = () => {
  const [rollos, setRollos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRollo, setSelectedRollo] = useState(null);
  const [tipoActivo, setTipoActivo] = useState('DTF'); // DTF o SUBLIM
  const [formData, setFormData] = useState({
    metraje_total: '',
    notas: ''
  });

  useEffect(() => {
    fetchRollos();
  }, [tipoActivo]);

  const fetchRollos = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rollos?tipo=${tipoActivo}`);
      setRollos(response.data || []);
    } catch (error) {
      console.error('Error al cargar rollos:', error);
      toast.error('Error al cargar los rollos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rollo) => {
    setSelectedRollo(rollo);
    setFormData({
      metraje_total: rollo.metraje_total || '',
      notas: rollo.notas || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRollo(null);
    setFormData({ metraje_total: '', notas: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.metraje_total || formData.metraje_total <= 0) {
      toast.error('El metraje debe ser mayor a 0');
      return;
    }

    try {
      await api.put('/rollos/actualizar-metraje', {
        numero_rollo: selectedRollo.numero_rollo,
        tipo: selectedRollo.tipo,
        metraje_total: parseFloat(formData.metraje_total),
        notas: formData.notas
      });

      toast.success(`Rollo ${selectedRollo.tipo} ${selectedRollo.numero_rollo} actualizado correctamente`);
      handleCloseModal();
      fetchRollos();
    } catch (error) {
      console.error('Error al actualizar rollo:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el rollo');
    }
  };

  const getStatusColor = (porcentaje) => {
    if (porcentaje >= 50) return 'bg-green-100 text-green-800';
    if (porcentaje >= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Control de Rollos</h1>
          <p className="text-gray-500 mt-1">Gestiona el metraje de los 32 rollos (16 DTF + 16 SUBLIM)</p>
        </div>
      </div>

      {/* Botones de Tipo */}
      <div className="flex space-x-2">
        <button
          onClick={() => setTipoActivo('DTF')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            tipoActivo === 'DTF'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Rollos DTF (16)</span>
          </div>
        </button>
        <button
          onClick={() => setTipoActivo('SUBLIM')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            tipoActivo === 'SUBLIM'
              ? 'bg-pink-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Rollos SUBLIM (16)</span>
          </div>
        </button>
      </div>

      {/* Grid de Rollos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rollos.map((rollo) => (
          <div key={`${rollo.tipo}-${rollo.numero_rollo}`} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Package className={`w-5 h-5 ${rollo.tipo === 'DTF' ? 'text-blue-600' : 'text-pink-600'}`} />
                <h3 className="text-lg font-bold text-gray-900">
                  <span className={`text-sm ${rollo.tipo === 'DTF' ? 'text-blue-600' : 'text-pink-600'}`}>
                    {rollo.tipo}
                  </span> {rollo.numero_rollo}
                </h3>
              </div>
              <button
                onClick={() => handleOpenModal(rollo)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Configurar metraje"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Disponible</span>
                <span className={`font-semibold ${getStatusColor(rollo.porcentaje_disponible)}`}>
                  {rollo.porcentaje_disponible}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    rollo.porcentaje_disponible >= 50 ? 'bg-green-500' :
                    rollo.porcentaje_disponible >= 20 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${rollo.porcentaje_disponible}%` }}
                ></div>
              </div>
            </div>

            {/* Métricas */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">{rollo.metraje_total}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disponible:</span>
                <span className="font-semibold text-green-600">{rollo.metraje_disponible}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usado:</span>
                <span className="font-semibold text-red-600">{rollo.metraje_usado}m</span>
              </div>
            </div>

            {/* Estado */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                rollo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {rollo.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {rollo.notas && (
              <div className="mt-2 text-xs text-gray-500 truncate" title={rollo.notas}>
                {rollo.notas}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Configuración */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Configurar Rollo <span className={selectedRollo?.tipo === 'DTF' ? 'text-blue-600' : 'text-pink-600'}>
                  {selectedRollo?.tipo}
                </span> {selectedRollo?.numero_rollo}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metraje Total (metros)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.metraje_total}
                  onChange={(e) => setFormData({ ...formData, metraje_total: e.target.value })}
                  className="input"
                  placeholder="Ej: 105.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa la cantidad exacta de metros del rollo nuevo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Ej: Rollo instalado el 06/11/2025"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Advertencia:</strong> Esta acción reiniciará el contador del rollo {selectedRollo?.numero_rollo} con el nuevo metraje.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary inline-flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rollos;
