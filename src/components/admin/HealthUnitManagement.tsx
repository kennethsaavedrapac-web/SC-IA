import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { HealthCenter } from "../../types";
import { supabase } from "../../lib/supabaseClient";
import { HEALTH_CENTERS } from "../../data/healthUnits";
import { Loader2 } from "lucide-react";

// Mock data for departments - in a real app, this would come from an API or file listing
const DEPARTAMENTOS = [
  "BOACO",
  "CARAZO",
  "CHINANDEGA",
  "CHONTALES",
  "ESTELI",
  "GRANADA",
  "JINOTEGA",
  "LEON",
  "MADRIZ",
  "MASAYA",
  "MANAGUA",
  "MATAGALPA",
  "NUEVA SEGOVIA",
  "RAAN",
  "RAAS",
  "RIO SAN JUAN",
  "RIVAS",
  "SAN JUAN DEL SUR",
  "ZELaya"
];

const HealthUnitManagement: React.FC = () => {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<string[]>(DEPARTAMENTOS);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("MANAGUA");
  const [healthUnits, setHealthUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<{ id: string; unit: any } | null>(null);
  const [newUnit, setNewUnit] = useState<any>({
    nombre: "",
    tipo_unidad_salud: "",
    municipio: "",
    localidad: "",
    zona: "",
    departamento_region: "",
    silais: "",
    telefono: "",
    latitud: null,
    longitud: null
  });

  // Load health units for selected department
  const loadHealthUnits = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch overrides from Supabase
      const { data: overrides, error: overridesError } = await supabase
        .from('health_center_overrides')
        .select('*')
        .ilike('departamento', selectedDepartment);
        
      if (overridesError) throw overridesError;
      
      const overrideMap = new Map(overrides?.map(o => [o.center_id, o]));
      
      // 2. Get JSON centers for this department
      const jsonCenters = HEALTH_CENTERS.filter(
        c => c.department?.toUpperCase() === selectedDepartment.toUpperCase()
      );
      
      // 3. Merge JSON with overrides
      const mergedCenters = jsonCenters.map(center => {
        const override = overrideMap.get(center.id);
        if (override) {
          return {
            ...center,
            name: override.nombre_nuevo || center.name,
            type: override.tipo || center.type,
            municipality: override.municipio || center.municipality,
            locality: override.localidad || center.locality,
            zone: override.zona || center.zone,
            phone: override.telefono || center.phone,
            latitude: override.latitud_ajustada || center.latitude,
            longitude: override.longitud_ajustada || center.longitude,
            _activo: override.activo !== false, // Default to true if null
            _hasOverride: true
          };
        }
        return { ...center, _activo: true, _hasOverride: false };
      });
      
      // 4. Add custom centers (not in JSON)
      const customCenters = overrides
        ?.filter(o => o.center_id.startsWith('custom-'))
        .map(o => ({
          id: o.center_id,
          name: o.nombre_nuevo,
          type: o.tipo,
          department: o.departamento,
          municipality: o.municipio,
          locality: o.localidad,
          zone: o.zona,
          phone: o.telefono,
          silais: o.silais,
          latitude: o.latitud_ajustada,
          longitude: o.longitud_ajustada,
          _activo: o.activo !== false,
          _hasOverride: true,
          isCustom: true
        })) || [];
        
      setHealthUnits([...mergedCenters, ...customCenters]);
    } catch (err: any) {
      setError(err.message || "Error al cargar las unidades de salud.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    loadHealthUnits();
  }, [loadHealthUnits]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewUnit((prev: typeof newUnit) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle saving (Add or Edit)
  const handleSaveUnit = async () => {
    if (!newUnit.nombre || !newUnit.tipo_unidad_salud) return;
    setIsSaving(true);
    try {
      const isNew = !editMode;
      const centerId = isNew ? `custom-${Date.now()}` : editMode!.id;
      
      const payload = {
        center_id: centerId,
        departamento: selectedDepartment,
        nombre_nuevo: newUnit.nombre,
        tipo: newUnit.tipo_unidad_salud,
        municipio: newUnit.municipio,
        localidad: newUnit.localidad,
        zona: newUnit.zona,
        silais: newUnit.silais,
        telefono: newUnit.telefono,
        latitud_ajustada: newUnit.latitud ? Number(newUnit.latitud) : null,
        longitud_ajustada: newUnit.longitud ? Number(newUnit.longitud) : null,
        actualizado_en: new Date().toISOString()
      };
      
      const { error } = await supabase.from('health_center_overrides').upsert(payload, { onConflict: 'center_id' });
      if (error) throw error;
      
      await loadHealthUnits();
      
      setEditMode(null);
      setNewUnit({
        nombre: "",
        tipo_unidad_salud: "",
        municipio: "",
        localidad: "",
        zona: "",
        departamento_region: selectedDepartment,
        silais: "",
        telefono: "",
        latitud: null,
        longitud: null
      });
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting health unit
  const handleDeleteUnit = async (unit: any) => {
    if (unit.isCustom) {
      if (!window.confirm("¿Seguro que deseas eliminar este centro personalizado?")) return;
      try {
        const { error } = await supabase.from('health_center_overrides').delete().eq('center_id', unit.id);
        if (error) throw error;
        await loadHealthUnits();
      } catch (err: any) {
        alert("Error al eliminar: " + err.message);
      }
    } else {
      // Logical delete (Toggle Activo status) for JSON centers
      try {
        const newState = !(unit._activo ?? true);
        const { error } = await supabase.from('health_center_overrides').upsert({
          center_id: unit.id,
          departamento: unit.department,
          activo: newState,
          actualizado_en: new Date().toISOString()
        }, { onConflict: 'center_id' });
        
        if (error) throw error;
        await loadHealthUnits();
      } catch (err: any) {
        alert("Error al cambiar estado: " + err.message);
      }
    }
  };

  // Handle edit button click
  const handleEditUnit = (unit: any) => {
    setEditMode({ id: unit.id, unit });
    setNewUnit({
      nombre: unit.name,
      tipo_unidad_salud: unit.type,
      municipio: unit.municipality || "",
      localidad: unit.locality || "",
      zona: unit.zone || "",
      departamento_region: unit.department || "",
      silais: unit.silais || "",
      telefono: unit.phone || "",
      latitud: unit.latitude || null,
      longitud: unit.longitude || null
    });
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('healthUnitManagement')}</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage and organize health units</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveUnit}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
            disabled={!newUnit.nombre || !newUnit.tipo_unidad_salud || isSaving}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('addHealthUnit')}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        {editMode ? (
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('editHealthUnit')}</h3>
        ) : (
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('addNewHealthUnit')}</h3>
        )}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('name')}</label>
              <input
                type="text"
                name="nombre"
                value={newUnit.nombre || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('type')}</label>
              <input
                type="text"
                name="tipo_unidad_salud"
                value={newUnit.tipo_unidad_salud || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('municipality')}</label>
              <input
                type="text"
                name="municipio"
                value={newUnit.municipio || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('locality')}</label>
              <input
                type="text"
                name="localidad"
                value={newUnit.localidad || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('zone')}</label>
              <select
                name="zona"
                value={newUnit.zona || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('selectZone')}</option>
                <option value="Urbano">{t('urban')}</option>
                <option value="Rural">{t('rural')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('silais')}</label>
              <input
                type="text"
                name="silais"
                value={newUnit.silais || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('phone')}</label>
            <input
              type="tel"
              name="telefono"
              value={newUnit.telefono || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('latitude')}</label>
              <input
                type="number"
                name="latitud"
                value={newUnit.latitud ? String(newUnit.latitud) : ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.000001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('longitude')}</label>
              <input
                type="number"
                name="longitud"
                value={newUnit.longitud ? String(newUnit.longitud) : ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.000001"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(null);
                    setNewUnit({
                      nombre: "",
                      tipo_unidad_salud: "",
                      municipio: "",
                      localidad: "",
                      zona: "",
                      departamento_region: selectedDepartment,
                      silais: "",
                      telefono: "",
                      latitud: null,
                      longitud: null
                    });
                  }}
                  className="mr-3 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveUnit}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center gap-2"
                  disabled={!newUnit.nombre || !newUnit.tipo_unidad_salud || isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('saveChanges')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSaveUnit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
                disabled={!newUnit.nombre || !newUnit.tipo_unidad_salud || isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('addHealthUnit')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Health Units List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('healthUnitsList')} ({healthUnits.length})</h3>
        </div>
        <div className="overflow-y-auto max-h-[400px]">
          {healthUnits.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
              <p>{t('noHealthUnitsFound')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {healthUnits.map((unit) => (
                <div key={unit.id} className={`px-6 py-4 flex justify-between items-center ${unit._activo === false ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${unit.isCustom ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                        {unit.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium text-slate-900 dark:text-white truncate ${unit._activo === false ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>{unit.name}</h4>
                          {unit._activo === false && <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">{t('inactive')}</span>}
                          {unit.isCustom && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold shrink-0">Custom</span>}
                          {unit._hasOverride && !unit.isCustom && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold shrink-0">Modificado</span>}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {unit.type} • {unit.municipality || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {unit.schedule}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditUnit(unit)}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUnit(unit)}
                        className={`px-3 py-1.5 text-xs font-medium ${unit._activo === false ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} text-white rounded-md focus:outline-none focus:ring-2`}
                      >
                        {unit.isCustom ? t('delete') : (unit._activo === false ? t('activate') : t('deactivate'))}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthUnitManagement;