import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { HEALTH_CENTERS } from "../../data/healthUnits";
import { MapPin, Search, Save, RotateCcw, Crosshair, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function LocationManagement() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [reason, setReason] = useState("");
  
  // Coordenadas ajustadas (temporales antes de guardar)
  const [adjustedLat, setAdjustedLat] = useState<number | null>(null);
  const [adjustedLng, setAdjustedLng] = useState<number | null>(null);
  
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch overrides (ajustes existentes) desde Supabase al iniciar
  useEffect(() => {
    const fetchOverrides = async () => {
      const { data, error } = await supabase.from('health_center_overrides').select('*');
      if (!error && data) {
        const map: Record<string, any> = {};
        data.forEach(d => {
          map[d.center_id] = d;
        });
        setOverrides(map);
      }
    };
    fetchOverrides();
  }, []);

  // Escuchar mensajes desde el iframe (cuando el usuario arrastra el pin o el mapa está listo)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === "MARKER_DRAGGED") {
          setAdjustedLat(event.data.lat);
          setAdjustedLng(event.data.lng);
        } else if (event.data.type === "MAP_READY") {
          updateMapCenter();
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedCenter, overrides]);

  // Enviar datos al mapa cuando cambia el centro seleccionado o cambian las coordenadas
  const updateMapCenter = () => {
    if (selectedCenter && iframeRef.current?.contentWindow) {
      // Coordenadas por defecto (Managua) si el centro no tiene
      const defaultLat = 12.1364;
      const defaultLng = -86.2514;
      
      // Usamos el valor temporal ajustado si existe, de lo contrario el override, el original o el default
      const lat = adjustedLat !== null ? adjustedLat : (overrides[selectedCenter.id]?.latitud_ajustada || selectedCenter.latitude || defaultLat);
      const lng = adjustedLng !== null ? adjustedLng : (overrides[selectedCenter.id]?.longitud_ajustada || selectedCenter.longitude || defaultLng);

      if (isNaN(lat) || isNaN(lng)) return;

      iframeRef.current.contentWindow.postMessage({
        type: "UPDATE_CENTER",
        center: {
          id: selectedCenter.id,
          name: selectedCenter.name,
          lat: lat,
          lng: lng,
          hasCoords: !!(lat !== defaultLat && lng !== defaultLng)
        }
      }, "*");
    }
  };

  useEffect(() => {
    if (selectedCenter) {
      setAdjustedLat(overrides[selectedCenter.id]?.latitud_ajustada || selectedCenter.latitude || null);
      setAdjustedLng(overrides[selectedCenter.id]?.longitud_ajustada || selectedCenter.longitude || null);
      setReason(overrides[selectedCenter.id]?.razon_ajuste || ""); 
    }
  }, [selectedCenter, overrides]);

  // Actualizar el mapa cuando cambian las coordenadas temporales
  useEffect(() => {
    if (selectedCenter && adjustedLat !== null && adjustedLng !== null) {
      updateMapCenter();
    }
  }, [adjustedLat, adjustedLng]);

  // Código HTML inyectado para el mapa de Leaflet
  const leafletHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; background: #f1f5f9; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px; font-family: system-ui; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([12.1364, -86.2514], 8);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

        let currentMarker = null;

        window.addEventListener('message', (event) => {
          const msg = event.data;
          if (msg.type === 'UPDATE_CENTER' && msg.center) {
            const { lat, lng, name, hasCoords } = msg.center;
            
            if (currentMarker) map.removeLayer(currentMarker);

            const iconHtml = '<div style="background-color: #3b82f6; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: transform 0.2s;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>';
            const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });

            currentMarker = L.marker([lat, lng], { icon: icon, draggable: true }).addTo(map);
            
            // Mensaje del popup
            const popupMsg = hasCoords ? "<b>" + name + "</b><br><span style='font-size: 12px; color: #64748b;'>Arrastrame para corregir la posición</span>" : "<b>" + name + "</b><br><span style='font-size: 12px; color: #eab308;'>📍 Sin coordenadas.<br/>Arrástrame a la ubicación real.</span>";
            currentMarker.bindPopup(popupMsg).openPopup();

            currentMarker.on('dragend', function(e) {
              const position = currentMarker.getLatLng();
              window.parent.postMessage({ type: 'MARKER_DRAGGED', lat: position.lat, lng: position.lng }, '*');
              currentMarker.bindPopup("<b>" + name + "</b><br><span style='font-size: 12px; color: #10b981;'>✓ Nueva posición seleccionada</span>").openPopup();
            });

            map.setView([lat, lng], hasCoords ? 16 : 8);
          }
        });

        // Notify parent that the map is ready to receive updates
        window.parent.postMessage({ type: 'MAP_READY' }, '*');
      </script>
    </body>
    </html>
  `, []);

  // Filter centers from existing JSON Data
  const filteredCenters = HEALTH_CENTERS.filter((c) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.municipality?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 15); // limit for UI performance

  // Mock total stats calculation
  const totalCenters = HEALTH_CENTERS.length;
  // Centros con coordenadas originales + los que hemos sobrescrito
  const withCoords = HEALTH_CENTERS.filter(c => c.latitude && c.longitude || overrides[c.id]).length;

  // Identificar si hubo un cambio en las coordenadas
  const hasChanges = selectedCenter && (
    adjustedLat !== (overrides[selectedCenter.id]?.latitud_ajustada || selectedCenter.latitude) || 
    adjustedLng !== (overrides[selectedCenter.id]?.longitud_ajustada || selectedCenter.longitude)
  );

  const handleRevert = () => {
    if (selectedCenter) {
      setAdjustedLat(overrides[selectedCenter.id]?.latitud_ajustada || selectedCenter.latitude || null);
      setAdjustedLng(overrides[selectedCenter.id]?.longitud_ajustada || selectedCenter.longitude || null);
      setReason(overrides[selectedCenter.id]?.razon_ajuste || "");
      updateMapCenter(); // Restaurar el pin en el iframe
    }
  };

  const handleSave = async () => {
    if (!selectedCenter || !adjustedLat || !adjustedLng) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('health_center_overrides').upsert({
        center_id: selectedCenter.id,
        departamento: selectedCenter.department,
        nombre_nuevo: selectedCenter.name,
        tipo: selectedCenter.type,
        municipio: selectedCenter.municipality,
        localidad: selectedCenter.locality,
        zona: selectedCenter.zone,
        silais: selectedCenter.silais,
        telefono: selectedCenter.phone,
        latitud_ajustada: adjustedLat,
        longitud_ajustada: adjustedLng,
        razon_ajuste: reason,
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'center_id' });

      if (error) throw error;
      
      // Actualizar estado local
      setOverrides(prev => ({
        ...prev,
        [selectedCenter.id]: {
          ...prev[selectedCenter.id],
          latitud_ajustada: adjustedLat,
          longitud_ajustada: adjustedLng,
          razon_ajuste: reason
        }
      }));
    } catch (err: any) {
      console.error("Error saving location:", err);
      alert("Error al guardar la posición en la base de datos: " + (err.message || err.details || JSON.stringify(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-auto lg:h-[calc(100vh-140px)] gap-6">
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">{t('totalCenters')}</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalCenters}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><MapPin className="w-5 h-5" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">{t('centersWithCoords')}</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{withCoords}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600"><Crosshair className="w-5 h-5" /></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between md:col-span-2">
          <div className="flex-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase">{t('howToUse')}</p>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium mt-1 leading-snug">
              1. {t('instructionsStep1')}<br/>
              2. Arrastra el pin en el mapa para corregir las coordenadas.<br/>
              3. {t('instructionsStep3')}<br/>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Side: Search and List */}
        <div className="w-full lg:w-1/3 h-[240px] lg:h-auto shrink-0 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar por nombre o ciudad..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredCenters.map(center => (
              <button 
                key={center.id}
                onClick={() => setSelectedCenter(center)}
                className={`w-full text-left p-3 rounded-xl transition-colors border ${selectedCenter?.id === center.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{center.name}</h4>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-slate-500 truncate">{center.municipality}</p>
                  {(center.latitude || overrides[center.id]) ? (
                    <span className={`w-2 h-2 rounded-full ${overrides[center.id] ? "bg-blue-500" : "bg-emerald-500"}`} title={overrides[center.id] ? "Coordenadas ajustadas manualmente" : "Tiene coordenadas originales"}></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Faltan coordenadas"></span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
 
        {/* Right Side: Map & Adjustment Area */}
        <div className="w-full lg:flex-1 h-[450px] lg:h-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden relative">
          {selectedCenter ? (
            <>
              {/* Interactive Map Area */}
              <div className="flex-1 relative flex items-center justify-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                <iframe
                  ref={iframeRef}
                  srcDoc={leafletHtml}
                  onLoad={updateMapCenter}
                  className="w-full h-full border-0 absolute inset-0 z-0"
                  title="Mapa de Ajuste"
                />
                
                {/* Coordenadas overlay superior */}
                <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                  <div className="text-slate-500 mb-1 font-sans font-bold text-[10px] uppercase tracking-wider">{overrides[selectedCenter.id] ? "Coordenadas Modificadas" : "Coordenadas Actuales"}</div>
                  <div className={hasChanges ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-800 dark:text-slate-300"}>
                    Lat: {adjustedLat?.toFixed(6) || "---"}<br/>
                    Lng: {adjustedLng?.toFixed(6) || "---"}
                  </div>
                </div>
              </div>

              {/* Controls Area */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 shrink-0 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[11px] uppercase font-bold text-slate-500 mb-1.5 block">Latitud (Manual)</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      value={adjustedLat !== null ? adjustedLat : ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value);
                        setAdjustedLat(val);
                      }}
                      placeholder="Ej: 12.1364"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-bold text-slate-500 mb-1.5 block">Longitud (Manual)</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      value={adjustedLng !== null ? adjustedLng : ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value);
                        setAdjustedLng(val);
                      }}
                      placeholder="Ej: -86.2514"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-[11px] uppercase font-bold text-slate-500 mb-1.5 block">{t('adjustmentReasonLabel')}</label>
                    <input 
                      type="text" 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t('adjustmentReasonPlaceholder')}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <button 
                      onClick={handleRevert}
                      disabled={!hasChanges}
                      className="h-[42px] px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95">
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden xl:inline">{t('revertToOriginal')}</span>
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={(!hasChanges && overrides[selectedCenter.id]?.razon_ajuste === reason) || isSaving}
                      className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md min-w-[140px]">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{isSaving ? "Guardando..." : t('savePosition')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MapPin className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700" />
              <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">{t('selectCenterToAdjust')}</h3>
              <p className="text-sm mt-2 max-w-sm text-center">Selecciona un centro de salud de la lista izquierda para visualizar y corregir sus coordenadas geográficas.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}