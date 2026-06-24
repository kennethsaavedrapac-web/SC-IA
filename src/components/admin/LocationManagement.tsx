import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { HEALTH_CENTERS } from "../../data/healthUnits";
import { MapPin, Search, Save, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function LocationManagement() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [reason, setReason] = useState("");
  
  const [adjustedLat, setAdjustedLat] = useState<number | null>(null);
  const [adjustedLng, setAdjustedLng] = useState<number | null>(null);
  
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [mergedCenters, setMergedCenters] = useState<any[]>(HEALTH_CENTERS);
  const [isSaving, setIsSaving] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch overrides and custom centers
  useEffect(() => {
    const fetchOverrides = async () => {
      const { data, error } = await supabase.from('health_center_overrides').select('*');
      if (!error && data) {
        const map: Record<string, any> = {};
        data.forEach(d => { map[d.center_id] = d; });
        setOverrides(map);

        // Filter and map custom centers
        const customCenters = data
          .filter(o => o.center_id.startsWith('custom-') && o.activo !== false)
          .map(o => ({
            id: o.center_id,
            name: o.nombre_nuevo,
            type: o.tipo,
            department: o.departamento,
            municipality: o.municipio,
            locality: o.localidad,
            zone: o.zona,
            phone: o.telefono,
            silais: o.silais || "",
            latitude: o.latitud_ajustada,
            longitude: o.longitud_ajustada,
            sourceNumber: 0,
            hasCoordinates: !!(o.latitud_ajustada && o.longitud_ajustada)
          }));

        // Merge standard centers with custom centers
        setMergedCenters([...HEALTH_CENTERS, ...customCenters]);
      }
    };
    fetchOverrides();
  }, []);

  // Message listener del iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === "MARKER_DRAGGED") {
          setAdjustedLat(event.data.lat);
          setAdjustedLng(event.data.lng);
        } else if (event.data.type === "MAP_READY") {
          
          sendCenterToMap();
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedCenter, adjustedLat, adjustedLng, overrides]);

  
  const sendCenterToMap = useCallback(() => {
    if (!selectedCenter || !iframeRef.current?.contentWindow) return;
    
    const defaultLat = 12.1364;
    const defaultLng = -86.2514;
    
    const lat = adjustedLat !== null ? adjustedLat : (overrides[selectedCenter.id]?.latitud_ajustada || selectedCenter.latitude || defaultLat);
    const lng = adjustedLng !== null ? adjustedLng : (overrides[selectedCenter.id]?.longitud_ajustada || selectedCenter.longitude || defaultLng);

    if (isNaN(lat) || isNaN(lng)) return;

    iframeRef.current.contentWindow.postMessage({
      type: "UPDATE_CENTER",
      center: {
        id: selectedCenter.id,
        name: selectedCenter.name,
        lat,
        lng,
        hasCoords: !!(lat !== defaultLat && lng !== defaultLng)
      }
    }, "*");
  }, [selectedCenter, adjustedLat, adjustedLng, overrides]);

  
  useEffect(() => {
    if (selectedCenter) {
      const newLat = overrides[selectedCenter.id]?.latitud_ajustada !== undefined 
        ? overrides[selectedCenter.id].latitud_ajustada 
        : selectedCenter.latitude || null;
      const newLng = overrides[selectedCenter.id]?.longitud_ajustada !== undefined
        ? overrides[selectedCenter.id].longitud_ajustada
        : selectedCenter.longitude || null;
      setAdjustedLat(newLat);
      setAdjustedLng(newLng);
      setReason(overrides[selectedCenter.id]?.razon_ajuste || "");
    }
  }, [selectedCenter, overrides]);

  // Cuando cambian coordenadas, enviar al mapa
  useEffect(() => {
    if (selectedCenter && adjustedLat !== null && adjustedLng !== null) {
      sendCenterToMap();
    }
  }, [adjustedLat, adjustedLng, selectedCenter, sendCenterToMap]);

  const leafletHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html,body,#map{height:100%;margin:0;padding:0;background:#f1f5f9}
        .leaflet-control-zoom{border:none!important;box-shadow:0 4px 12px rgba(0,0,0,.1)!important}
        .leaflet-bar a{background-color:#fff!important;color:#1e293b!important;border-bottom:1px solid #e2e8f0!important}
        .leaflet-bar a:hover{background-color:#f8fafc!important}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', {zoomControl: true, attributionControl: false}).setView([12.1364, -86.2514], 8);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {maxZoom: 19}).addTo(map);

        let currentMarker = null;

        function updateCenter(center) {
          const { lat, lng, name, hasCoords } = center;
          
          if (currentMarker) map.removeLayer(currentMarker);

          const iconHtml = '<div style="background:#3b82f6;width:36px;height:36px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:transform .2s"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>';
          const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });

          currentMarker = L.marker([lat, lng], { icon: icon, draggable: true }).addTo(map);
          
          const popupMsg = hasCoords
            ? '<b>' + name + '</b><br><span style="font-size:12px;color:#64748b">Arrástrame para corregir la posición</span>'
            : '<b>' + name + '</b><br><span style="font-size:12px;color:#eab308">📍 Sin coordenadas.<br/>Arrástrame a la ubicación real.</span>';
          currentMarker.bindPopup(popupMsg).openPopup();

          currentMarker.on('dragend', function() {
            const pos = currentMarker.getLatLng();
            window.parent.postMessage({ type: 'MARKER_DRAGGED', lat: pos.lat, lng: pos.lng }, '*');
            currentMarker.bindPopup('<b>' + name + '</b><br><span style="font-size:12px;color:#10b981">✓ Nueva posición seleccionada</span>').openPopup();
          });

          map.setView([lat, lng], hasCoords ? 16 : 8);
        }

        window.addEventListener('message', function(event) {
          const msg = event.data;
          if (msg.type === 'UPDATE_CENTER' && msg.center) {
            updateCenter(msg.center);
          }
        });

        window.parent.postMessage({ type: 'MAP_READY' }, '*');
      </script>
    </body>
    </html>
  `, []);

  const filteredCenters = mergedCenters.filter((c) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.municipality?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 30);

  const totalCenters = mergedCenters.length;
  const withCoords = mergedCenters.filter(c => c.latitude && c.longitude || overrides[c.id]).length;
  const adjustedCount = Object.keys(overrides).length;

  const hasChanges = selectedCenter && (
    adjustedLat !== (overrides[selectedCenter.id]?.latitud_ajustada ?? selectedCenter.latitude) || 
    adjustedLng !== (overrides[selectedCenter.id]?.longitud_ajustada ?? selectedCenter.longitude)
  );

  const handleRevert = () => {
    if (selectedCenter) {
      setAdjustedLat(overrides[selectedCenter.id]?.latitud_ajustada || selectedCenter.latitude || null);
      setAdjustedLng(overrides[selectedCenter.id]?.longitud_ajustada || selectedCenter.longitude || null);
      setReason(overrides[selectedCenter.id]?.razon_ajuste || "");
    }
  };

  const handleSave = async () => {
    if (!selectedCenter || !adjustedLat || !adjustedLng) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('health_center_overrides').upsert({
        center_id: selectedCenter.id, departamento: selectedCenter.department, nombre_nuevo: selectedCenter.name,
        tipo: selectedCenter.type, municipio: selectedCenter.municipality, localidad: selectedCenter.locality,
        zona: selectedCenter.zone, silais: selectedCenter.silais, telefono: selectedCenter.phone,
        latitud_ajustada: adjustedLat, longitud_ajustada: adjustedLng, razon_ajuste: reason,
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'center_id' });
      if (error) throw error;
      
      setOverrides(prev => ({ 
        ...prev, 
        [selectedCenter.id]: { 
          ...prev[selectedCenter.id], 
          latitud_ajustada: adjustedLat, 
          longitud_ajustada: adjustedLng, 
          razon_ajuste: reason 
        } 
      }));

      // Update mergedCenters coordinates
      setMergedCenters(prev => prev.map(c => {
        if (c.id === selectedCenter.id) {
          return {
            ...c,
            latitude: adjustedLat,
            longitude: adjustedLng,
            hasCoordinates: true
          };
        }
        return c;
      }));
    } catch (err: any) {
      console.error("Error saving location:", err);
      alert("Error: " + (err.message || err.details || JSON.stringify(err)));
    } finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full lg:overflow-hidden overflow-y-auto">

      {/* ═══ PANEL IZQUIERDO ═══ */}
      <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col shrink-0 lg:h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        
        {/* Buscador */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar centro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Área scrollable interna */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4">
          
          {/* Lista de centros */}
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-y-auto max-h-[195px]">
            <div className="p-2 space-y-1">
              {filteredCenters.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No se encontraron centros.</p>
              ) : (
                filteredCenters.map(center => (
                  <button
                    key={center.id}
                    onClick={() => setSelectedCenter(center)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all border ${
                      selectedCenter?.id === center.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{center.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{center.municipality}{center.department ? `, ${center.department}` : ''}</p>
                      </div>
                      {(center.latitude || overrides[center.id]) ? (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${overrides[center.id] ? "bg-blue-500" : "bg-emerald-500"}`} />
                      ) : (
                        <span className="w-2 h-2 rounded-full shrink-0 bg-amber-400" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Panel de edición */}
          {selectedCenter && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  Ajustar coordenadas
                </h3>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 truncate max-w-[140px]">
                  {selectedCenter.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Latitud</label>
                  <input type="number" step="any" value={adjustedLat ?? ""} onChange={(e) => setAdjustedLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                    placeholder="12.1364" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Longitud</label>
                  <input type="number" step="any" value={adjustedLng ?? ""} onChange={(e) => setAdjustedLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                    placeholder="-86.2514" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Razón de ajuste</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                  placeholder="Ej: Coordenadas corregidas según ubicación real."
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-all resize-none" />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleRevert} disabled={!hasChanges}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${hasChanges ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95" : "bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed"}`}>
                  <RotateCcw className="w-3 h-3" />
                  Revertir
                </button>
                <button onClick={handleSave} disabled={!hasChanges || isSaving || !adjustedLat || !adjustedLng}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex-1 justify-center ${hasChanges && !isSaving ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.98]" : "bg-blue-100 dark:bg-blue-900/30 text-blue-300 dark:text-blue-600 cursor-not-allowed"}`}>
                  {isSaving ? (<><Loader2 className="w-3 h-3 animate-spin" />Guardando...</>) : (<><Save className="w-3 h-3" />{hasChanges ? "Guardar cambios" : "Sin cambios"}</>)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAPA ═══ */}
      <div className="flex-1 h-[50vh] lg:h-full bg-white dark:bg-slate-900 lg:rounded-none overflow-hidden relative min-h-[350px]">
        {selectedCenter ? (
          <>
            <iframe ref={iframeRef} srcDoc={leafletHtml} className="w-full h-full border-0" title="Mapa de Ajuste" />
            
            {/* Flotante de Coordenadas */}
            <div className="absolute top-2.5 left-14 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shadow-md rounded-xl p-2 border border-slate-200 dark:border-slate-850 flex flex-col pointer-events-auto">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {overrides[selectedCenter.id] ? "Coord. Modificadas" : "Coord. Originales"}
              </span>
              <div className={`font-mono text-[10px] mt-0.5 flex items-center gap-2.5 ${hasChanges ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                <span>Lat: {adjustedLat?.toFixed(6) || "---"}</span>
                <span>Lng: {adjustedLng?.toFixed(6) || "---"}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8">
            <MapPin className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">{t('selectCenterToAdjust')}</h3>
            <p className="text-sm mt-2 max-w-sm text-center">Selecciona un centro de salud de la lista para visualizar y corregir sus coordenadas.</p>
          </div>
        )}
      </div>

    </div>
  );
}