import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { HealthCenter } from "../../types";
import { supabase } from "../../lib/supabaseClient";
import { AlertTriangle, Clock, RefreshCw, Share2, Trash2, Zap } from "lucide-react";

interface HealthCenterOverride {
  id: string;
  center_id: string;
  lat_override: number | null;
  lng_override: number | null;
  original_lat: number;
  original_lng: number;
  is_active: boolean;
  adjustment_reason: string | null;
  adjusted_by: string;
  adjusted_at: string;
  edit_history: any[]; // JSON array of previous changes
}

interface MapCenter extends HealthCenter {
  hasOverride: boolean;
  overrideLat: number | null;
  overrideLng: number | null;
}

const LocationManagement: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [healthCenters, setHealthCenters] = useState<MapCenter[]>([]);
  - [overrides, setOverrides] = useState<HealthCenterOverride[]>([]);
  - [loading, setLoading] = useState(true);
  - [error, setError] = useState<string | null>(null);
  - [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  - [mapRef, setMapRef] = useCallback((node: HTMLDivElement | null) => {
      if (node) setMapRef(node);
    }, []);
  - [mapInstance, setMapInstance] = useState<any>(null);
  - [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setError("Acceso denegado");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch health centers (from existing data source)
        // In a real implementation, we'd fetch from Supabase or use existing HEALTH_CENTERS
        // For now, we'll use the existing data and combine with overrides

        // Fetch overrides from Supabase
        const { data: overridesData, error: overridesError } = await supabase
          .from('health_center_overrides')
          .select('*')
          .order('adjusted_at', { ascending: false });

        if (overridesError) throw overridesError;
        setOverrides(overridesData || []);

        // For now, we'll use mock data since we don't have direct access to HEALTH_CENTERS
        // In production, this would import from src/data/healthUnits.ts
        const mockHealthCenters: MapCenter[] = [
          {
            id: "carazo-1-0",
            name: "Puesto de Salud Esquipulas",
            type: "Puesto de Salud",
            schedule: "Lunes a Viernes 8:00 - 16:00",
            distance: "2.5 km",
            durationMin: 10,
            lat: 50,
            lng: 50,
            latitude: 11.9024,
            longitude: -86.1642,
            department: "Carazo",
            municipality: "La Paz de Oriente",
            locality: "Iglesia de Esquipulas, 100 mts arriba, Esquipulas",
            zone: "Urbano",
            phone: "+505  XXXXXXXX",
            silais: "CARAZO",
            sourceNumber: 1,
            hasCoordinates: true,
            hasOverride: false,
            overrideLat: null,
            overrideLng: null
          },
          {
            id: "carazo-6-0",
            name: "Centro de Salud Sócrates Flores",
            type: "Centro de Salud",
            schedule: "Lunes a Viernes 7:00 - 19:00",
            distance: "5.2 km",
            durationMin: 15,
            lat: 60,
            lng: 40,
            latitude: 11.8562,
            longitude: -86.1878,
            department: "Carazo",
            municipality: "San Marcos",
            locality: "Instituto Juan XXII, 1 ½c. Al norte, colonia Manuel Moya, Manuel Moya",
            zone: "Rural",
            phone: "+505  XXXXXXXX",
            silais: "CARAZO",
            sourceNumber: 6,
            hasCoordinates: true,
            hasOverride: false,
            overrideLat: null,
            overrideLng: null
          }
        ];

        // Combine with overrides
        const centersWithOverrides = mockHealthCenters.map(center => {
          const override = overridesData?.find(
            ov => ov.center_id === center.id && ov.is_active
          );

          return {
            ...center,
            hasOverride: !!override,
            overrideLat: override?.lat_override ?? null,
            overrideLng: override?.lng_override ?? null
          };
        });

        setHealthCenters(centersWithOverrides);
      } catch (err: any) {
        setError(err.message || 'Error loading data');
        console.error('Error loading location data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapRef.current, {
      center: [12.1, -85.5],
      zoom: 8,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    setMapInstance(map);

    // Cleanup
    return () => {
      map.remove();
    };
  }, [mapRef]);

  // Update map markers when data changes
  useEffect(() => {
    if (!mapInstance || healthCenters.length === 0) return;

    // Clear existing markers
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        mapInstance.removeLayer(layer);
      }
    });

    // Add markers for each health center
    healthCenters.forEach(center => {
      const lat = center.overrideLat !== null ? center.overrideLat : center.latitude;
      const lng = center.overrideLng !== null ? center.overrideLng : center.longitude;

      if (!lat || !lng) return;

      // Determine marker color based on override status
      const markerColor = center.hasOverride ? '#ff9800' : '#4caf50'; // Orange for overridden, green for original

      const marker = L.marker([lat, lng], {
        draggable: isAdmin, // Only admins can drag
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${center.type.includes('Hospital') ? 'H' : '+'}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      });

      marker.addTo(mapInstance);

      // Bind popup
      marker.bindPopup(`
        <b>${center.name}</b><br/>
        ${center.type}<br/>
        ${center.municipality}, ${center.department}<br/>
        ${center.hasOverride ? '<span style="color: #ff9800;">Posición ajustada</span>' : '<span style="color: #4caf50;">Posición original</span>'}
      `);

      // Handle drag end (only for admins)
      if (isAdmin) {
        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          // Update state temporarily - actual save happens on confirm
          setHealthCenters(prev =>
            prev.map(c =>
              c.id === center.id
                ? {
                    ...c,
                    overrideLat: pos.lat,
                    overrideLng: pos.lng,
                    hasOverride: true
                  }
                : c
            )
          );
        });
      }
    });

    // If we have a selected center, pan to it
    if (selectedCenterId) {
      const selected = healthCenters.find(c => c.id === selectedCenterId);
      if (selected) {
        const lat = selected.overrideLat !== null ? selected.overrideLat : selected.latitude;
        const lng = selected.overrideLng !== null ? selected.overrideLng : selected.longitude;
        if (lat && lng) {
          mapInstance.setView([lat, lng], 15);
        }
      }
    }
  }, [mapInstance, healthCenters, selectedCenterId, isAdmin]);

  // Save override to Supabase
  const saveOverride = useCallback(async (centerId: string) => {
    try {
      const center = healthCenters.find(c => c.id === centerId);
      if (!center) return;

      const lat = center.overrideLat;
      const lng = center.overrideLng;

      if (lat === null || lng === null) {
        // If coordinates are null, we're reverting to original - delete override
        const override = overrides.find(ov => ov.center_id === centerId && ov.is_active);
        if (override) {
          const { error } = await supabase
            .from('health_center_overrides')
            .update({ is_active: false })
            .eq('id', override.id);

          if (error) throw error;
        }
      } else {
        // Check if there's an existing active override
        const existingOverride = overrides.find(ov => ov.center_id === centerId && ov.is_active);

        const overrideData = {
          center_id: centerId,
          lat_override: lat,
          lng_override: lng,
          original_lat: center.latitude,
          original_lng: center.longitude,
          is_active: true,
          adjustment_reason: `Posición ajustada por administrador`,
          adjusted_by: user?.id || 'unknown',
          // edit_history would be handled in a more complex implementation
        };

        if (existingOverride) {
          // Update existing override
          const { error } = await supabase
            .from('health_center_overrides')
            .update(overrideData)
            .eq('id', existingOverride.id);

          if (error) throw error;
        } else {
          // Insert new override
          const { error } = await supabase
            .from('health_center_overwards')
            .insert(overrideData);

          if (error) throw error;
        }
      }

      // Refresh data
      await loadData();

      // Show success (would use toast in real implementation)
      alert('Posición guardada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error saving position');
      console.error('Error saving override:', err);
      throw err;
    }
  }, [healthCenters, overrides, user, supabase]);

  // Reload data function
  const reloadData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 dark:text-slate-400">{t('accessDenied')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('locationManagement')}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={reloadData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4" /> {t('refresh')}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('howToUse')}</h3>
        <ol className="list-decimal pl-6 space-y-2 text-slate-700 dark:text-slate-300">
          <li>{t('instructionsStep1')}</li>
          <li>{t('instructionsStep2')}</li>
          <li>{t('instructionsStep3')}</li>
          <li>{t('instructionsStep4')}</li>
        </ol>
      </div>

      {/* Map Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg h-[500px]">
        <div ref={mapRef} className="h-full w-full" />

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
          <button
            onClick={() => {
              // Center map on user location if available
              if (userLocation) {
                mapInstance?.setView([userLocation.latitude, userLocation.longitude], 12);
              }
            }}
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800/50 rounded-full shadow-md hover:bg-white/90 dark:hover:bg-slate-700/60 transition-colors"
            title={t('centerOnMe')}
          >
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              📍
            </div>
          </button>

          <button
            onClick={() => {
              // Reset map view to default Nicaragua view
              mapInstance?.setView([12.1, -85.5], 8);
            }}
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800/50 rounded-full shadow-md hover:bg-white/90 dark:hover:bg-slate-700/60 transition-colors"
            title={t('resetView')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('selectedCenter')}</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          {selectedCenterId ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center">
                    {healthCenters.find(c => c.id === selectedCenterId)?.hasOverride ? (
                      <div className="w-8 h-8 bg-orange-500 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-green-500 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {healthCenters.find(c => c.id === selectedCenterId)?.name || 'Centro desconocido'}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('centerType', { type: healthCenters.find(c => c.id === selectedCenterId)?.type || '' }}) |
                      {t('municipality', { municipality: healthCenters.find(c => c.id === selectedCenterId)?.municipality || '' }},
                      {t('department', { department: healthCenters.find(c => c.id === selectedCenterId)?.department || '' })}
                    </p>
                  </div>
                </div>

                {/* Change reason input */}
                <div className={t('adjustmentReason')}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('adjustmentReasonLabel')}</label>
                  <textarea
                    placeholder={t('adjustmentReasonPlaceholder')}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      // Revert to original position
                      const center = healthCenters.find(c => c.id === selectedCenterId);
                      if (center) {
                        setHealthCenters(prev =>
                          prev.map(c =>
                            c.id === center.id
                              ? {
                                  ...c,
                                  overrideLat: null,
                                  overrideLng: null,
                                  hasOverride: false
                                }
                              : c
                          )
                        );
                        // Save the revert (this will delete the override)
                        saveOverride(selectedCenterId);
                      }
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {t('revertToOriginal')}
                  </button>

                  <button
                    onClick={() => saveOverride(selectedCenterId!)}
                    disabled ={true} // Would enable when form is valid
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {t('savePosition')}
                  </button>
                </div>
              </>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>{t('selectCenterToAdjust')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('statistics')}</h3>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('totalCenters')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{healthCenters.length}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('adjustedCenters')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {healthCenters.filter(c => c.hasOverride).length}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('centersWithCoords')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {healthCenters.filter(c => c.hasCoordinates).length}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('centersWithoutCoords')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {healthCenters.filter(c => !c.hasCoordinates).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationManagement;