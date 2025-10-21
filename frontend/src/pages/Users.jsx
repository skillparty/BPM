import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Save, Shield, User as UserIcon } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'colaborador'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'colaborador'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    try {
      await api.post('/auth/register', formData);
      toast.success('Usuario creado exitosamente');
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast.error(error.response?.data?.message || 'Error al crear el usuario');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar este usuario?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      toast.success('Usuario desactivado exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      toast.error(error.response?.data?.message || 'Error al desactivar el usuario');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="btn btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className={`p-3 rounded-lg ${
                  user.role === 'super_admin' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {user.role === 'super_admin' ? (
                    <Shield className="w-6 h-6 text-purple-600" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{user.full_name}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                {user.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                ✉️ {user.email}
              </p>
              <p className="text-sm">
                <span className={`badge ${
                  user.role === 'super_admin' ? 'badge-info' : 'badge-warning'
                }`}>
                  {user.role === 'super_admin' ? 'Super Admin' : 'Colaborador'}
                </span>
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Creado: {new Date(user.created_at).toLocaleDateString('es-BO')}
              </div>
              {user.is_active && (
                <button
                  onClick={() => handleDeactivate(user.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Desactivar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No hay usuarios registrados</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nuevo Usuario</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="username" className="label">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="full_name" className="label">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="label">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="input"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div>
                  <label htmlFor="role" className="label">
                    Rol *
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
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
                    <span>Crear Usuario</span>
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

export default Users;
