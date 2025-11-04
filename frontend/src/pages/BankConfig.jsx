import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload, Save, Download } from 'lucide-react';

const BankConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder: '',
    ci_nit: '',
    account_number: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/bank-config');
      setConfig(response.data);
      setFormData({
        bank_name: response.data.bank_name || '',
        account_holder: response.data.account_holder || '',
        ci_nit: response.data.ci_nit || '',
        account_number: response.data.account_number || ''
      });
    } catch (error) {
      console.error('Error al cargar configuracion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/bank-config', formData);
      toast.success('Configuracion actualizada');
      fetchConfig();
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast.error('Error al actualizar configuracion');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast.error('Solo se permiten imagenes JPG o PNG');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    setUploading(true);
    const formDataImage = new FormData();
    formDataImage.append('qr_image', file);

    try {
      await api.post('/bank-config/qr-image', formDataImage, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Imagen QR subida exitosamente');
      fetchConfig();
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const downloadQRImage = async () => {
    try {
      const response = await api.get('/bank-config/qr-image', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'qr_banco_bpm.png');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('QR descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar QR:', error);
      toast.error('Error al descargar QR. Verifica que hayas subido la imagen');
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion Bancaria</h1>
        <p className="text-gray-500 mt-1">Configura tus datos bancarios y QR de pago</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de datos bancarios */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Datos Bancarios</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banco
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titular de la cuenta
              </label>
              <input
                type="text"
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CI/NIT
              </label>
              <input
                type="text"
                value={formData.ci_nit}
                onChange={(e) => setFormData({ ...formData, ci_nit: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero de cuenta
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="input"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </form>
        </div>

        {/* Subir imagen QR */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">QR de Pago</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sube la imagen del QR generado desde tu app bancaria. Este QR se enviara a los clientes via WhatsApp.
          </p>

          <div className="space-y-4">
            {/* Preview de la imagen */}
            {config?.qr_image_path && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">QR Actual:</p>
                <img
                  src={config.qr_image_path}
                  alt="QR de pago"
                  className="max-w-xs mx-auto"
                />
              </div>
            )}

            {/* Botones para subir y descargar imagen */}
            <div className="space-y-3">
              <label className="btn btn-secondary w-full cursor-pointer inline-flex items-center justify-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Subiendo...' : 'Subir Nueva Imagen'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              
              {config?.qr_image_path && (
                <button
                  onClick={downloadQRImage}
                  className="btn btn-primary w-full inline-flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar QR Banco</span>
                </button>
              )}
              
              <p className="text-xs text-gray-500">
                Formatos permitidos: JPG, PNG. Tamano maximo: 5MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankConfig;
