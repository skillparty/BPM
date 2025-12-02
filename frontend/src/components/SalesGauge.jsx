import React from 'react';

// Función fuera del componente para evitar problemas de dependencias
const getColor = (pct) => {
  if (pct < 30) {
    // Rojo a naranja
    const factor = pct / 30;
    const r = 239;
    const g = Math.round(68 + (142 * factor));
    const b = 68;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (pct < 70) {
    // Naranja a amarillo a verde claro
    const factor = (pct - 30) / 40;
    const r = Math.round(234 - (112 * factor));
    const g = Math.round(179 + (5 * factor));
    const b = Math.round(8 + (51 * factor));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Verde claro a verde oscuro
    const factor = (pct - 70) / 30;
    const r = Math.round(122 - (100 * factor));
    const g = Math.round(184 - (23 * factor));
    const b = Math.round(59 + (35 * factor));
    return `rgb(${r}, ${g}, ${b})`;
  }
};

const SalesGauge = ({ current, target = 400, type = 'pedidos' }) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  const color = getColor(percentage);
  
  // Formatear valores según el tipo
  const formatValue = (value) => {
    if (type === 'dinero') {
      return `Bs. ${value.toFixed(2)}`;
    } else if (type === 'metros') {
      return `${value.toFixed(0)} m`;
    } else if (type === 'unidades') {
      return `${value} unidades`;
    }
    return value;
  };
  
  // Crear el gradiente para el arco
  const gradientStops = [];
  for (let i = 0; i <= 100; i += 10) {
    gradientStops.push({
      offset: `${i}%`,
      color: getColor(i)
    });
  }

  // Coordenadas de la aguja
  // El arco tiene radio 85px con strokeWidth=20px
  // Borde interior (superior visualmente): 85 - 10 = 75px
  // La aguja debe apuntar al BORDE SUPERIOR (interior) del arco
  const needleLength = 75;
  
  // Calcular ángulo donde termina el arco coloreado
  // 0% = 180° (izquierda), 100% = 0° (derecha)
  // En SVG, el eje Y crece hacia ABAJO, así que restamos el seno
  const angleInDegrees = 180 - (percentage / 100) * 180;
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  
  const needleX = 100 + needleLength * Math.cos(angleInRadians);
  const needleY = 100 - needleLength * Math.sin(angleInRadians); // Invertir Y

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <svg width="250" height="150" viewBox="0 0 200 120" className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientStops.map((stop, idx) => (
              <stop key={idx} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Arco de fondo */}
        <path
          d="M 15 100 A 85 85 0 0 1 185 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Arco con degradado */}
        <path
          d="M 15 100 A 85 85 0 0 1 185 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 267} 267`}
        />
        
        {/* Marcadores */}
        {[0, 30, 70, 100].map((mark) => {
          const markAngleDeg = 180 - (mark / 100) * 180;
          const markAngleRad = (markAngleDeg * Math.PI) / 180;
          const markX1 = 100 + 75 * Math.cos(markAngleRad);
          const markY1 = 100 - 75 * Math.sin(markAngleRad); // Invertir Y
          const markX2 = 100 + 85 * Math.cos(markAngleRad);
          const markY2 = 100 - 85 * Math.sin(markAngleRad); // Invertir Y
          
          return (
            <line
              key={mark}
              x1={markX1}
              y1={markY1}
              x2={markX2}
              y2={markY2}
              stroke="#6b7280"
              strokeWidth="2"
            />
          );
        })}
        
        {/* Centro */}
        <circle cx="100" cy="100" r="8" fill="#1f2937" />
        
        {/* Aguja */}
        <line
          x1="100"
          y1="100"
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Punto central de la aguja */}
        <circle cx="100" cy="100" r="5" fill={color} />
      </svg>
      
      {/* Información */}
      <div className="text-center mt-4">
        <div className="text-4xl font-bold" style={{ color }}>
          {type === 'dinero' ? current.toFixed(0) : current}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          de {formatValue(target)}
        </div>
        <div className="text-lg font-semibold mt-2" style={{ color }}>
          {percentage.toFixed(1)}%
        </div>
      </div>
      
      {/* Etiquetas de escala */}
      <div className="flex justify-between w-full max-w-[250px] mt-2 text-xs font-medium">
        <span style={{ color: getColor(0) }}>0</span>
        <span style={{ color: getColor(30) }}>30%</span>
        <span style={{ color: getColor(70) }}>70%</span>
        <span style={{ color: getColor(100) }}>100%</span>
      </div>
    </div>
  );
};

export default SalesGauge;
