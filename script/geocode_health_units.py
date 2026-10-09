#!/usr/bin/env python3
"""
Script de geocodificación para centros de salud de Nicaragua
Geocodifica centros sin coordenadas usando Nominatim (OpenStreetMap)
"""

import json
import requests
import time
import os
from pathlib import Path
from typing import Dict, Any, Optional

# Configuración del rate limiting de Nominatim
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
RATE_LIMIT = 1  # 1 solicitud por segundo (Nominatim policy)
HEADERS = {
    'User-Agent': 'SaludConectaIA/1.3.0 (healthmap@nicaragua.gov.ni)'
}

def geocode_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Geocodificar un centro individual usando Nominatim (OpenStreetMap)
    
    Args:
        entry: Centro de salud con campos como nombre, municipio, departamento_region, localidad
        
    Returns:
        Centro con coordenadas agregadas o null si falla
    """
    # Construir una consulta geográfica detallada con contexto
    components = []
    
    # La ubicación específica del centro (más preciso que solo el nombre)
    if entry.get("localidad"):
        components.append(entry["localidad"])
    elif entry.get("nombre"):
        components.append(entry["nombre"])
    
    # Contexto geográfico
    if entry.get("municipio"):
        components.append(entry["municipio"])
    if entry.get("departamento_region"):
        components.append(entry["departamento_region"])
    
    components.append("Nicaragua")
    
    address = ", ".join(components)
    
    try:
        response = requests.get(
            NOMINATIM_URL,
            params={
                "q": address,
                "format": "json",
                "limit": 1,
                "addressdetails": 1,
                "accept_language": "es",
                "extratags": 1,
                "namedetails": 1
            },
            headers=HEADERS,
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        if data and len(data) > 0:
            location = data[0]
            lat = float(location["lat"])
            lng = float(location["lon"])
            
            # Validar que las coordenadas estén dentro de los límites de Nicaragua
            if (-90 <= lat <= 15) and (-90 <= lng <= -80):
                print(f"✓ Geocodificado: {entry.get('nombre', 'Centro sin nombre')} -> ({lat:.6f}, {lng:.6f})")
                return {
                    **entry,
                    "latitud": lat,
                    "longitud": lng,
                    "geocodificado_en": time.strftime("%Y-%m-%d %H:%M:%S")
                }
            else:
                print(f"⚠ Coordenadas fuera del límite de Nicaragua: {entry.get('nombre')}")
        else:
            print(f"✗ Sin resultados para: {entry.get('nombre')}")
            
    except requests.RequestException as e:
        print(f"✗ Error de API al geocodificar {entry.get('nombre')}: {e}")
    except (KeyError, ValueError, TypeError) as e:
        print(f"✗ Error al procesar respuesta para {entry.get('nombre')}: {e}")
    
    return entry

def main():
    """Main function to geocode all health units."""
    base_path = Path("src/data/healthUnits")
    
    if not base_path.exists():
        print(f"❌ Directory {base_path} not found")
        return
    
    json_files = sorted(base_path.glob("*.json"))
    total_units = 0
    with_coords = 0
    without_coords = 0
    
    print(f"🔍 Processing {len(json_files)} JSON files...")
    print(f"Total health units to process: {total_units}")
    
    for json_file in json_files:
        print(f"\n📂 Processing {json_file.name}...")
        
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            units = data.get("unidades_salud", [])
            total_units += len(units)
            
            # Count existing coordinates
            existing_with_coords = sum(
                1 for unit in units 
                if unit.get("latitud") is not None and unit.get("longitud") is not None
            )
            
            print(f"  Existing coordinates: {existing_with_coords}/{len(units)}")
            
            # Geocode units without coordinates
            units_geocodified = 0
            for i, unit in enumerate(units):
                if unit.get("latitud") is None or unit.get("longitud") is None:
                    # Geocode this unit
                    updated_unit = geocode_entry(unit)
                    units[i] = updated_unit
                    units_geocodified += 1
                    
                    # Respect rate limiting
                    time.sleep(RATE_LIMIT)
            
            without_coords += len(units) - existing_with_coords
            with_coords += existing_with_coords + units_geocodified
            
            print(f"  Geocodificadas: {units_geocodified}/{len(units) - existing_with_coords}")
            
            # Save the updated file
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2, separators=(',', ': '))
            
            print(f"  ✓ Saved updated {json_file.name}")
            
        except Exception as e:
            print(f"❌ Error processing {json_file.name}: {e}")
            continue
    
    print(f"\n{'='*60}")
    print(f"📊 SUMMARY")
    print(f"{'='*60}")
    print(f"Total health units: {total_units}")
    print(f"With coordinates (after geocoding): {with_coords}")
    print(f"Without coordinates: {without_coords}")
    print(f"Coverage: {100 * with_coords / total_units:.1f}%")
    
    # Generate summary report
    summary = {
        "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_units": total_units,
        "with_coordinates": with_coords,
        "without_coordinates": without_coords,
        "coverage_percent": round(100 * with_coords / total_units, 1),
        "files_processed": len(json_files)
    }
    
    # Save summary to a JSON file
    summary_file = Path("geocoding_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Summary saved to: {summary_file}")
    print(f"\n✅ Geocodificación completada!")

if __name__ == "__main__":
    main()