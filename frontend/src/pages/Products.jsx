import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, X, Save, Package } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stock_meters: 0,
    cost_per_meter: 0,
    category: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        stock_meters: product.stock_meters || 0,
        cost_per_meter: product.cost_per_meter || 0,
        category: product.category || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        stock_meters: 0,
        cost_per_meter: 0,
        category: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado exitosamente');
      }
      handleCloseModal();
      fetchProducts();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el producto');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar este producto?')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto desactivado exitosamente');
      fetchProducts();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">Gestiona el inventario de productos y bobinas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Package className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                  {product.category && (
                    <span className="badge badge-info text-xs mt-1">
                      {product.category}
                    </span>
                  )}
                </div>
              </div>
              <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                {product.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500">Stock (metros)</p>
                <p className="font-semibold text-gray-900">
                  {parseFloat(product.stock_meters || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Costo/metro</p>
                <p className="font-semibold text-gray-900">
                  Bs. {parseFloat(product.cost_per_meter || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleOpenModal(product)}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Desactivar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                </div>

                <div>
                  <label htmlFor="description" className="label">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="stock_meters" className="label">
                      Stock (metros)
                    </label>
                    <input
                      type="number"
                      id="stock_meters"
                      value={formData.stock_meters}
                      onChange={(e) => setFormData({...formData, stock_meters: e.target.value})}
                      className="input"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="cost_per_meter" className="label">
                      Costo por metro (Bs)
                    </label>
                    <input
                      type="number"
                      id="cost_per_meter"
                      value={formData.cost_per_meter}
                      onChange={(e) => setFormData({...formData, cost_per_meter: e.target.value})}
                      className="input"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="label">
                    Categoría
                  </label>
                  <input
                    type="text"
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input"
                    placeholder="Ej: Bobinas, Textiles, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
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
                    <span>{editingProduct ? 'Actualizar' : 'Crear'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
