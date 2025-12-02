import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  User, 
  ShoppingCart, 
  Command,
  ArrowRight,
  Loader2
} from 'lucide-react';
import api from '../services/api';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ clients: [], orders: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults({ clients: [], orders: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], orders: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [clientsRes, ordersRes] = await Promise.all([
          api.get(`/clients?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/orders?search=${encodeURIComponent(query)}&limit=5`)
        ]);
        
        setResults({
          clients: clientsRes.data?.clients || clientsRes.data || [],
          orders: ordersRes.data?.orders || ordersRes.data || []
        });
      } catch (error) {
        console.error('Error en búsqueda:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Get all results as flat array for keyboard navigation
  const allResults = [
    ...results.clients.map(c => ({ type: 'client', data: c })),
    ...results.orders.map(o => ({ type: 'order', data: o }))
  ];

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    }
  }, [allResults, selectedIndex, onClose]);

  const handleSelect = (item) => {
    if (item.type === 'client') {
      navigate(`/clients?search=${item.data.phone}`);
    } else if (item.type === 'order') {
      navigate(`/orders/${item.data.id}/edit`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
        <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 transform transition-all">
          {/* Search input */}
          <div className="flex items-center px-4 border-b border-slate-200">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar clientes, pedidos..."
              className="flex-1 px-4 py-4 text-slate-900 placeholder-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
            />
            {loading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
            <div className="flex items-center space-x-1 text-xs text-slate-400 ml-2">
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">esc</kbd>
              <span>para cerrar</span>
            </div>
          </div>

          {/* Results */}
          {query && (
            <div className="max-h-96 overflow-y-auto py-2">
              {/* Clients section */}
              {results.clients.length > 0 && (
                <div className="px-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Clientes
                  </p>
                  {results.clients.map((client, idx) => {
                    const resultIndex = idx;
                    const isSelected = selectedIndex === resultIndex;
                    
                    return (
                      <button
                        key={client.phone}
                        onClick={() => handleSelect({ type: 'client', data: client })}
                        onMouseEnter={() => setSelectedIndex(resultIndex)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-100' : 'bg-slate-100'}`}>
                            <User className={`w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-slate-500'}`} />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">{client.name}</p>
                            <p className="text-xs text-slate-500">{client.phone}</p>
                          </div>
                        </div>
                        {isSelected && <ArrowRight className="w-4 h-4 text-primary-500" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Orders section */}
              {results.orders.length > 0 && (
                <div className="px-2 mt-2">
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pedidos
                  </p>
                  {results.orders.map((order, idx) => {
                    const resultIndex = results.clients.length + idx;
                    const isSelected = selectedIndex === resultIndex;
                    
                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelect({ type: 'order', data: order })}
                        onMouseEnter={() => setSelectedIndex(resultIndex)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-100' : 'bg-slate-100'}`}>
                            <ShoppingCart className={`w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-slate-500'}`} />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">{order.receipt_number}</p>
                            <p className="text-xs text-slate-500">{order.client_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            order.payment_status === 'pagado' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : order.payment_status === 'parcial'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            Bs. {parseFloat(order.total || 0).toFixed(2)}
                          </span>
                          {isSelected && <ArrowRight className="w-4 h-4 text-primary-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {!loading && results.clients.length === 0 && results.orders.length === 0 && query.length > 0 && (
                <div className="px-4 py-8 text-center">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No se encontraron resultados para "{query}"</p>
                </div>
              )}
            </div>
          )}

          {/* Quick actions when no query */}
          {!query && (
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Acciones rápidas
              </p>
              <button 
                onClick={() => { navigate('/orders/new'); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Nuevo Pedido</span>
                </div>
                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">N</kbd>
              </button>
              <button 
                onClick={() => { navigate('/clients'); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Ver Clientes</span>
                </div>
                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 font-mono">C</kbd>
              </button>
            </div>
          )}

          {/* Footer hint */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">↓</kbd>
                <span>navegar</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">↵</kbd>
                <span>seleccionar</span>
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Command className="w-3 h-3" />
              <span>+ K para abrir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
