import React, { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { HealthCenter } from "../../types";
import * as fs from "fs";

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
  const [healthUnits, setHealthUnits] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<{ id: string; unit: HealthCenter } | null>(null);
  const [newUnit, setNewUnit] = useState<Partial<HealthCenter>>({
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
  useEffect(() => {
    const loadHealthUnits = async () => {
      try {
        setLoading(true);
        // In a real app, we would fetch from an API or Supabase
        // For now, we'll simulate loading from JSON files
        // Since we can't actually read files in the browser, we'll mock this

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data - in reality, this would come from JSON files or database
        const mockData: HealthCenter[] = [
          {
            id: "1",
            name: "Puesto de Salud Esquipulas",
            type: "Puesto de Salud",
            schedule: "Lunes a Viernes 8:00 - 16:00",
            distance: "2.5 km",
            durationMin: 10,
            lat: 50,
            lng: 50,
            department: "CARAZO",
            municipality: "La Paz de Oriente",
            locality: "Iglesia de Esquipulas, 100 mts arriba, Esquipulas",
            zone: "Urbano",
            phone: "+505  XXXXXXXX",
            silais: "CARAZO",
            sourceNumber: 1
          },
          {
            id: "2",
            name: "Centro de Salud Sócrates Flores",
            type: "Centro de Salud",
            schedule: "Lunes a Viernes 7:00 - 19:00",
            distance: "5.2 km",
            durationMin: 15,
            lat: 60,
            lng: 40,
            department: "CARAZO",
            municipality: "San Marcos",
            locality: "Instituto Juan XXII, 1 ½c. Al norte, colonia Manuel Moya, Manuel Moya",
            zone: "Rural",
            phone: "+505  XXXXXXXX",
            silais: "CARAZO",
            sourceNumber: 6
          }
        ];

        setHealthUnits(mockData);
      } catch (err) {
        setError("Failed to load health units");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadHealthUnits();
  }, [selectedDepartment]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewUnit(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle adding new health unit
  const handleAddUnit = async () => {
    try {
      // In a real app, this would send to API/Supabase
      // For now, we'll just add to local state with a mock ID
      const newUnitWithId: HealthCenter = {
        ...newUnit,
        id: Date.now().toString(),
        lat: Number(newUnit.lat) || 50,
        lng: Number(newUnit.lng) || 50
      } as HealthCenter;

      setHealthUnits(prev => [newUnitWithId, ...prev]);

      // Reset form
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
    } catch (err) {
      setError("Failed to add health unit");
      console.error(err);
    }
  };

  // Handle updating health unit
  const handleUpdateUnit = async () => {
    if (!editMode) return;

    try {
      // In a real app, this would send to API/Supabase
      // Update local state
      setHealthUnits(prev =>
        prev.map(unit =>
          unit.id === editMode!.id
            ? { ...editMode!.unit, ...newUnit } as HealthCenter
            : unit
        )
      );

      // Exit edit mode
      setEditMode(null);

      // Reset form to blank
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
    } catch (err) {
      setError("Failed to update health unit");
      console.error(err);
    }
  };

  // Handle deleting health unit
  const handleDeleteUnit = async (id: string) => {
    try {
      // In a real app, this would send to API/Supabase
      setHealthUnits(prev => prev.filter(unit => unit.id !== id));
    } catch (err) {
      setError("Failed to delete health unit");
      console.error(err);
    }
  };

  // Handle edit button click
  const handleEditUnit = (unit: HealthCenter) => {
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
      latitud: unit.lat,
      longitud: unit.lng
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
          <p className="text-slate-500 dark:text-slate-400">{t('manageHealthUnitsDesc')}</p>
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
            onClick={handleAddUnit}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={!newUnit.nombre || !newUnit.tipo_unidad_salud}
          >
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
                name="lat"
                value={newUnit.lat ? String(newUnit.lat) : ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.000001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('longitude')}</label>
              <input
                type="number"
                name="lng"
                value={newUnit.lng ? String(newUnit.lng) : ""}
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
                  onClick={handleUpdateUnit}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!newUnit.nombre || !newUnit.tipo_unidad_salud}
                >
                  {t('saveChanges')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAddUnit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!newUnit.nombre || !newUnit.tipo_unidad_salud}
              >
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
                <div key={unit.id} className="px-6 py-4 flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {unit.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">{unit.name}</h4>
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
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {t('delete')}
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