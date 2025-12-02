import { useState, useRef, useEffect } from 'react';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Columns, 
  Download, 
  FileSpreadsheet, 
  FileText,
  X,
  Calendar,
  Check,
  RotateCcw
} from 'lucide-react';

// Panel de Filtros Avanzados Colapsable
export const AdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  workTypes = [],
  isOpen,
  onToggle
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      dateFrom: '',
      dateTo: '',
      workType: '',
      minAmount: '',
      maxAmount: '',
      status: '',
      paymentStatus: ''
    };
    setLocalFilters(emptyFilters);
    onReset();
  };

  const hasActiveFilters = Object.values(localFilters).some(v => v !== '');

  return (
    <div className="card overflow-hidden">
      {/* Header con toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <span className="font-medium text-slate-700">Filtros Avanzados</span>
          {hasActiveFilters && (
            <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
              Activos
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Panel de filtros */}
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-4 pt-0 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Rango de Fechas */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Desde
              </label>
              <input
                type="date"
                value={localFilters.dateFrom || ''}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Hasta
              </label>
              <input
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="input"
              />
            </div>

            {/* Tipo de Trabajo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Trabajo
              </label>
              <select
                value={localFilters.workType || ''}
                onChange={(e) => handleChange('workType', e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                {workTypes.map(wt => (
                  <option key={wt.id} value={wt.id}>{wt.name}</option>
                ))}
              </select>
            </div>

            {/* Rango de Montos */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monto Mín
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={localFilters.minAmount || ''}
                  onChange={(e) => handleChange('minAmount', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monto Máx
                </label>
                <input
                  type="number"
                  placeholder="∞"
                  value={localFilters.maxAmount || ''}
                  onChange={(e) => handleChange('maxAmount', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={resetFilters}
              className="btn btn-secondary inline-flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
            <button
              onClick={applyFilters}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Filtros</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Selector de Columnas
export const ColumnSelector = ({ columns, visibleColumns, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (columnKey) => {
    if (visibleColumns.includes(columnKey)) {
      onChange(visibleColumns.filter(c => c !== columnKey));
    } else {
      onChange([...visibleColumns, columnKey]);
    }
  };

  const selectAll = () => {
    onChange(columns.map(c => c.key));
  };

  const visibleCount = visibleColumns.length;
  const totalCount = columns.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary inline-flex items-center space-x-2"
      >
        <Columns className="w-4 h-4" />
        <span className="hidden sm:inline">Columnas</span>
        <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">
          {visibleCount}/{totalCount}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-50 animate-fade-in-down">
          <div className="p-2 border-b border-slate-100">
            <button
              onClick={selectAll}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Seleccionar todas
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {columns.map(column => (
              <label
                key={column.key}
                className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column.key)}
                  onChange={() => toggleColumn(column.key)}
                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Botones de Exportación
export const ExportButtons = ({ onExportExcel, onExportPDF, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="btn btn-secondary inline-flex items-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 animate-fade-in-down">
          <button
            onClick={() => {
              onExportExcel();
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-slate-700">Excel</div>
              <div className="text-xs text-slate-500">Formato .xlsx</div>
            </div>
          </button>
          <button
            onClick={() => {
              onExportPDF();
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            <FileText className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-sm font-medium text-slate-700">PDF</div>
              <div className="text-xs text-slate-500">Formato .pdf</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// Componente completo de controles de tabla
const AdvancedTableControls = ({
  filters,
  onFiltersChange,
  onResetFilters,
  columns,
  visibleColumns,
  onColumnsChange,
  onExportExcel,
  onExportPDF,
  workTypes = [],
  totalRecords = 0,
  filteredRecords = 0
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Barra de controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <span>
            Mostrando <strong className="text-slate-700">{filteredRecords}</strong> de{' '}
            <strong className="text-slate-700">{totalRecords}</strong> registros
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <ColumnSelector
            columns={columns}
            visibleColumns={visibleColumns}
            onChange={onColumnsChange}
          />
          <ExportButtons
            onExportExcel={onExportExcel}
            onExportPDF={onExportPDF}
            disabled={filteredRecords === 0}
          />
        </div>
      </div>

      {/* Panel de filtros avanzados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onReset={onResetFilters}
        workTypes={workTypes}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />
    </div>
  );
};

export default AdvancedTableControls;
