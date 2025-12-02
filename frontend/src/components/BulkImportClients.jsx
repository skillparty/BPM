import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Users,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Plantilla de columnas para clientes
const TEMPLATE_COLUMNS = [
  { key: 'phone', label: 'Teléfono *', required: true, example: '78945612' },
  { key: 'name', label: 'Nombre *', required: true, example: 'Juan Pérez' },
  { key: 'empresa', label: 'Empresa', required: false, example: 'Mi Empresa S.R.L.' },
  { key: 'tipo_cliente', label: 'Tipo (B2B/B2C)', required: false, example: 'B2C' },
  { key: 'razon_social', label: 'Razón Social', required: false, example: 'Mi Empresa S.R.L.' },
  { key: 'nit', label: 'NIT', required: false, example: '1234567890' },
  { key: 'pais', label: 'País', required: false, example: 'Bolivia' },
  { key: 'departamento', label: 'Departamento', required: false, example: 'Santa Cruz' },
  { key: 'ciudad', label: 'Ciudad', required: false, example: 'Santa Cruz de la Sierra' }
];

const BulkImportClients = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Generar y descargar plantilla Excel con formato de tabla profesional
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BPM System';
    workbook.created = new Date();

    // ==================== HOJA DE CLIENTES ====================
    const sheet = workbook.addWorksheet('Clientes', {
      views: [{ state: 'frozen', ySplit: 1 }] // Congelar primera fila
    });

    // Definir columnas con headers
    sheet.columns = [
      { header: 'Teléfono *', key: 'phone', width: 15 },
      { header: 'Nombre *', key: 'name', width: 28 },
      { header: 'Empresa', key: 'empresa', width: 25 },
      { header: 'Tipo (B2B/B2C)', key: 'tipo_cliente', width: 15 },
      { header: 'Razón Social', key: 'razon_social', width: 28 },
      { header: 'NIT', key: 'nit', width: 15 },
      { header: 'País', key: 'pais', width: 12 },
      { header: 'Departamento', key: 'departamento', width: 18 },
      { header: 'Ciudad', key: 'ciudad', width: 22 }
    ];

    // Estilo del header
    const headerRow = sheet.getRow(1);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' } // Azul primary
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' },
        size: 11
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '1E3A8A' } },
        bottom: { style: 'thin', color: { argb: '1E3A8A' } },
        left: { style: 'thin', color: { argb: '1E3A8A' } },
        right: { style: 'thin', color: { argb: '1E3A8A' } }
      };
    });

    // Datos de ejemplo
    const exampleData = [
      { phone: '78945612', name: 'Juan Pérez', empresa: 'Mi Empresa S.R.L.', tipo_cliente: 'B2C', razon_social: '', nit: '', pais: 'Bolivia', departamento: 'Santa Cruz', ciudad: 'Santa Cruz de la Sierra' },
      { phone: '76543210', name: 'María García', empresa: 'Empresa ABC', tipo_cliente: 'B2B', razon_social: 'Empresa ABC S.R.L.', nit: '9876543210', pais: 'Bolivia', departamento: 'La Paz', ciudad: 'La Paz' },
      { phone: '71234567', name: 'Carlos López', empresa: '', tipo_cliente: 'B2C', razon_social: '', nit: '', pais: 'Bolivia', departamento: 'Cochabamba', ciudad: 'Cochabamba' }
    ];

    // Agregar filas de ejemplo
    exampleData.forEach((data, index) => {
      const row = sheet.addRow(data);
      row.height = 20;
      
      // Alternar colores de fila
      const bgColor = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.font = { size: 10, color: { argb: '64748B' } }; // Color gris para ejemplos
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
      });
    });

    // Agregar filas vacías con formato
    for (let i = 0; i < 20; i++) {
      const row = sheet.addRow({});
      row.height = 20;
      const bgColor = (i + exampleData.length) % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
      
      for (let col = 1; col <= 9; col++) {
        const cell = row.getCell(col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
      }
    }

    // Agregar filtros automáticos (simula Ctrl+T)
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 24, column: 9 }
    };

    // ==================== HOJA DE INSTRUCCIONES ====================
    const instructionsSheet = workbook.addWorksheet('Instrucciones');
    instructionsSheet.columns = [{ width: 70 }];

    const instructions = [
      { text: 'INSTRUCCIONES DE USO', style: 'title' },
      { text: '', style: 'normal' },
      { text: '1. Complete los datos en la hoja "Clientes"', style: 'normal' },
      { text: '2. Los campos marcados con * son obligatorios:', style: 'normal' },
      { text: '   • Teléfono: Solo números, 7-15 dígitos', style: 'indent' },
      { text: '   • Nombre: Nombre completo del cliente', style: 'indent' },
      { text: '', style: 'normal' },
      { text: '3. Campos opcionales:', style: 'normal' },
      { text: '   • Empresa: Nombre de la empresa (si aplica)', style: 'indent' },
      { text: '   • Tipo: B2B (empresa) o B2C (persona)', style: 'indent' },
      { text: '   • Razón Social: Para facturación', style: 'indent' },
      { text: '   • NIT: Número de identificación tributaria', style: 'indent' },
      { text: '   • País, Departamento, Ciudad: Ubicación', style: 'indent' },
      { text: '', style: 'normal' },
      { text: '4. Puede eliminar las filas de ejemplo (grises) antes de importar', style: 'normal' },
      { text: '', style: 'normal' },
      { text: '5. Guarde el archivo y súbalo en el sistema', style: 'normal' },
      { text: '', style: 'normal' },
      { text: 'NOTAS IMPORTANTES:', style: 'subtitle' },
      { text: '• Si el teléfono ya existe, se actualizarán los datos del cliente', style: 'note' },
      { text: '• Las filas vacías serán ignoradas automáticamente', style: 'note' },
      { text: '• Máximo recomendado: 500 clientes por importación', style: 'note' }
    ];

    instructions.forEach((item, index) => {
      const row = instructionsSheet.addRow([item.text]);
      const cell = row.getCell(1);
      
      if (item.style === 'title') {
        cell.font = { bold: true, size: 16, color: { argb: '1E40AF' } };
        row.height = 30;
      } else if (item.style === 'subtitle') {
        cell.font = { bold: true, size: 12, color: { argb: 'DC2626' } };
        row.height = 24;
      } else if (item.style === 'note') {
        cell.font = { size: 11, color: { argb: 'DC2626' } };
      } else if (item.style === 'indent') {
        cell.font = { size: 11, color: { argb: '475569' } };
      } else {
        cell.font = { size: 11, color: { argb: '1E293B' } };
      }
    });

    // Generar y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_clientes_BPM.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success('Plantilla descargada');
  };

  // Procesar archivo Excel
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrors([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setErrors([{ row: 0, message: 'El archivo está vacío o solo tiene cabeceras' }]);
          return;
        }

        // Mapear cabeceras a keys
        const headers = jsonData[0];
        const headerMap = {};
        
        headers.forEach((header, index) => {
          const col = TEMPLATE_COLUMNS.find(c => 
            c.label.toLowerCase().replace(' *', '') === header.toLowerCase().replace(' *', '') ||
            c.key.toLowerCase() === header.toLowerCase()
          );
          if (col) {
            headerMap[index] = col.key;
          }
        });

        // Procesar filas de datos
        const parsedData = [];
        const parseErrors = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.every(cell => !cell)) continue; // Saltar filas vacías

          const record = {};
          Object.entries(headerMap).forEach(([index, key]) => {
            record[key] = row[parseInt(index)]?.toString().trim() || '';
          });

          // Validaciones
          const rowErrors = [];
          
          if (!record.phone) {
            rowErrors.push('Teléfono es requerido');
          } else if (!/^\d{7,15}$/.test(record.phone.replace(/\D/g, ''))) {
            rowErrors.push('Teléfono debe tener entre 7 y 15 dígitos');
          }
          
          if (!record.name) {
            rowErrors.push('Nombre es requerido');
          }

          if (record.tipo_cliente && !['B2B', 'B2C', 'b2b', 'b2c'].includes(record.tipo_cliente)) {
            rowErrors.push('Tipo debe ser B2B o B2C');
          }

          if (rowErrors.length > 0) {
            parseErrors.push({ row: i + 1, message: rowErrors.join(', '), data: record });
          } else {
            // Normalizar datos
            record.phone = record.phone.replace(/\D/g, '');
            record.tipo_cliente = (record.tipo_cliente || 'B2C').toUpperCase();
            parsedData.push({ ...record, _row: i + 1 });
          }
        }

        setData(parsedData);
        setErrors(parseErrors);

        if (parsedData.length === 0 && parseErrors.length === 0) {
          setErrors([{ row: 0, message: 'No se encontraron datos válidos en el archivo' }]);
        }
      } catch (error) {
        console.error('Error al procesar archivo:', error);
        setErrors([{ row: 0, message: 'Error al procesar el archivo. Verifica el formato.' }]);
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  // Eliminar fila de la vista previa
  const removeRow = (index) => {
    setData(data.filter((_, i) => i !== index));
  };

  // Importar clientes
  const handleImport = async () => {
    if (data.length === 0) {
      toast.error('No hay datos para importar');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const response = await api.post('/clients/bulk', { clients: data });
      
      setImportResult({
        success: response.data.created || 0,
        updated: response.data.updated || 0,
        failed: response.data.failed || 0,
        errors: response.data.errors || []
      });

      if (response.data.created > 0 || response.data.updated > 0) {
        toast.success(`${response.data.created} clientes creados, ${response.data.updated} actualizados`);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error al importar:', error);
      toast.error(error.response?.data?.message || 'Error al importar clientes');
      setImportResult({
        success: 0,
        updated: 0,
        failed: data.length,
        errors: [{ message: error.response?.data?.message || 'Error de conexión' }]
      });
    } finally {
      setImporting(false);
    }
  };

  // Resetear estado
  const resetState = () => {
    setFile(null);
    setData([]);
    setErrors([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Importar Clientes</h2>
              <p className="text-sm text-slate-500">Registro masivo desde archivo Excel</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Instrucciones y descarga de plantilla */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Instrucciones</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Descarga la plantilla Excel con el formato correcto</li>
                  <li>2. Completa los datos de los clientes (Teléfono y Nombre son obligatorios)</li>
                  <li>3. Sube el archivo y revisa la vista previa</li>
                  <li>4. Confirma la importación</li>
                </ul>
              </div>
              <button
                onClick={downloadTemplate}
                className="btn btn-primary inline-flex items-center space-x-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Plantilla</span>
              </button>
            </div>
          </div>

          {/* Upload area */}
          {!file && (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-slate-500">
                Formatos soportados: .xlsx, .xls, .csv
              </p>
            </div>
          )}

          {/* File info */}
          {file && (
            <div className="flex items-center justify-between bg-slate-100 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {data.length} registros válidos • {errors.length} con errores
                  </p>
                </div>
              </div>
              <button
                onClick={resetState}
                className="btn btn-secondary inline-flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Cambiar archivo</span>
              </button>
            </div>
          )}

          {/* Errores de validación */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-red-800 font-medium mb-2">
                <AlertCircle className="w-5 h-5" />
                <span>Errores encontrados ({errors.length})</span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {errors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-sm text-red-700">
                    {error.row > 0 ? `Fila ${error.row}: ` : ''}{error.message}
                  </p>
                ))}
                {errors.length > 10 && (
                  <p className="text-sm text-red-600 font-medium mt-2">
                    ... y {errors.length - 10} errores más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Vista previa de datos */}
          {data.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-medium text-slate-900">
                  Vista Previa ({data.length} clientes)
                </h3>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Teléfono</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Empresa</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Ciudad</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {data.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-sm text-slate-500">{row._row}</td>
                        <td className="px-3 py-2 text-sm font-medium text-slate-900">{row.phone}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.name}</td>
                        <td className="px-3 py-2 text-sm text-slate-500">{row.empresa || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`badge ${row.tipo_cliente === 'B2B' ? 'badge-info' : 'badge-success'}`}>
                            {row.tipo_cliente}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-500">{row.ciudad || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeRow(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Eliminar de la importación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resultado de importación */}
          {importResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              importResult.failed === 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className={`w-5 h-5 ${
                  importResult.failed === 0 ? 'text-green-600' : 'text-amber-600'
                }`} />
                <span className="font-medium">Importación completada</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 bg-white rounded">
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-slate-500">Creados</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                  <div className="text-slate-500">Actualizados</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-slate-500">Fallidos</div>
                </div>
              </div>
              {importResult.errors?.length > 0 && (
                <div className="mt-3 text-sm text-red-600">
                  {importResult.errors.map((err, i) => (
                    <p key={i}>{err.phone ? `${err.phone}: ` : ''}{err.message}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Cerrar
          </button>
          
          {data.length > 0 && !importResult && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Importar {data.length} Clientes</span>
                </>
              )}
            </button>
          )}

          {importResult && (
            <button
              onClick={handleClose}
              className="btn btn-primary"
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportClients;
