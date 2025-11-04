/**
 * Genera un string QR Simple según el formato usado en Bolivia
 * Formato de texto plano compatible con todos los bancos bolivianos
 */

/**
 * Genera QR Simple para pagos en Bolivia
 * Formato: JSON con campos específicos que leen las apps bancarias
 * @param {Object} params - Parámetros del QR
 * @param {string} params.beneficiario - Nombre del beneficiario
 * @param {string} params.ci - CI o NIT del beneficiario
 * @param {string} params.cuenta - Número de cuenta
 * @param {string} params.banco - Código o nombre del banco
 * @param {number} params.monto - Monto de la transacción
 * @param {string} params.glosa - Descripción/glosa de la transacción
 * @returns {string} String para generar QR Simple
 */
export const generateQRSimple = ({
  beneficiario,
  ci,
  cuenta,
  banco,
  monto,
  glosa
}) => {
  // QR informativo para que el cliente vea los datos y haga la transferencia
  const qrLines = [
    `=== DATOS DE PAGO ===`,
    ``,
    `Banco: ${banco}`,
    `Beneficiario: ${beneficiario}`,
    `CI: ${ci}`,
    `Cuenta: ${cuenta}`,
    ``,
    `Monto a pagar: Bs. ${parseFloat(monto).toFixed(2)}`,
    `Concepto: ${glosa}`,
    ``,
    `Escanea este QR y realiza la transferencia desde tu app bancaria`
  ];
  
  return qrLines.join('\n');
};

/**
 * Genera QR Simple específico para un pedido
 * @param {Object} order - Datos del pedido
 * @param {Object} bankConfig - Configuración bancaria
 * @returns {string} String para QR Simple
 */
export const generateOrderQRSimple = (order, bankConfig) => {
  return generateQRSimple({
    beneficiario: bankConfig.account_holder,
    ci: bankConfig.ci_nit,
    cuenta: bankConfig.account_number,
    banco: bankConfig.bank_name,
    monto: parseFloat(order.total || 0),
    glosa: `Pedido ${order.receipt_number}`
  });
};
