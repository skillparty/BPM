import { 
  ShoppingCart, 
  Users, 
  Package, 
  FileText, 
  Search,
  Plus,
  Inbox
} from 'lucide-react';
import { Link } from 'react-router-dom';

const icons = {
  orders: ShoppingCart,
  clients: Users,
  products: Package,
  reports: FileText,
  search: Search,
  default: Inbox
};

const EmptyState = ({ 
  type = 'default',
  title = 'No hay datos',
  description = 'Aún no hay información para mostrar.',
  actionLabel,
  actionHref,
  onAction
}) => {
  const Icon = icons[type] || icons.default;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Animated icon container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20" />
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-full">
          <Icon className="w-12 h-12 text-slate-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">
        {title}
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
        {description}
      </p>

      {/* Action button */}
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link
            to={actionHref}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>{actionLabel}</span>
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>{actionLabel}</span>
          </button>
        )
      )}
    </div>
  );
};

// Specific empty states
export const NoOrdersFound = () => (
  <EmptyState
    type="orders"
    title="No hay pedidos"
    description="Aún no tienes pedidos registrados. Crea tu primer pedido para comenzar."
    actionLabel="Nuevo Pedido"
    actionHref="/orders/new"
  />
);

export const NoClientsFound = () => (
  <EmptyState
    type="clients"
    title="No hay clientes"
    description="Aún no tienes clientes registrados. Los clientes se crean automáticamente al crear un pedido."
  />
);

export const NoSearchResults = ({ query }) => (
  <EmptyState
    type="search"
    title="Sin resultados"
    description={`No se encontraron resultados para "${query}". Intenta con otros términos de búsqueda.`}
  />
);

export const NoProductsFound = () => (
  <EmptyState
    type="products"
    title="No hay productos"
    description="Aún no tienes productos en el almacén. Agrega productos para gestionar tu inventario."
    actionLabel="Nuevo Producto"
    actionHref="/products/new"
  />
);

export default EmptyState;
