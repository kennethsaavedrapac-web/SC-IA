import React from 'react';
import { UserProfile } from '../types';
import { MedicalFormData } from '../lib/fhirService';

interface EmergencyCardProps {
  user: UserProfile;
  localMedicalData: MedicalFormData;
}

export default function EmergencyCard({ user, localMedicalData }: EmergencyCardProps) {
  // Cédula y datos derivados
  const cedula = localMedicalData?.cedula || "";
  let birthDate = "NO REGISTRADA";
  let placeOfBirth = "NICARAGUA";
  
  // Extraer fecha de nacimiento de cédula nicaragüense: XXX-DDMMYY-XXXXL
  const cedulaRegex = /^\d{3}-(\d{2})(\d{2})(\d{2})-\d{4}[a-zA-Z]$/;
  const match = cedula.match(cedulaRegex);
  if (match) {
    const [ , dd, mm, yy ] = match;
    const year = parseInt(yy) > 30 ? `19${yy}` : `20${yy}`;
    birthDate = `${dd}-${mm}-${year}`;
  }

  if (user.city) {
    placeOfBirth = user.city.toUpperCase();
  }

  return (
    <div className="flex flex-col items-center justify-center w-full py-2">
      <div className="relative w-full max-w-[500px] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-slate-50 border border-slate-200 group select-none" style={{ aspectRatio: '1.58' }}>
        
        {/* Fondo: Ondas tipo montaña (Ometepe inspiradas) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-t from-sky-200/50 to-transparent"></div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute bottom-0 w-full h-[60%] opacity-40">
            <path d="M0,100 L0,60 Q20,50 40,70 T80,50 T100,80 L100,100 Z" fill="#93c5fd" />
            <path d="M0,100 L0,80 Q25,60 50,80 T100,70 L100,100 Z" fill="#60a5fa" />
          </svg>
          <div className="absolute top-0 right-0 w-[80%] h-[80%] opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {Array.from({ length: 20 }).map((_, i) => (
                <circle key={i} cx="50" cy="50" r={i * 4} fill="none" stroke="#000" strokeWidth="0.3" />
              ))}
            </svg>
          </div>
        </div>

        {/* Borde izquierdo (banda azul a verde con escudo simulado) */}
        <div className="absolute left-0 top-0 bottom-0 w-[14%] bg-gradient-to-b from-blue-700 via-teal-600 to-emerald-500 z-10 flex flex-col items-center pt-[30%]">
           {/* Escudo simulado (círculo y triángulo) */}
           <div className="w-[85%] aspect-square rounded-full border-[1.5px] border-white/60 flex items-center justify-center p-[2px]">
             <svg viewBox="0 0 100 100" className="w-full h-full text-white/80" fill="currentColor">
               <polygon points="50,10 90,85 10,85" fill="none" stroke="currentColor" strokeWidth="4"/>
               <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2"/>
               {/* Rayos simulados */}
               <path d="M30,70 Q50,40 70,70" fill="none" stroke="currentColor" strokeWidth="2"/>
             </svg>
           </div>
        </div>

        {/* Contenido principal de la tarjeta */}
        <div className="relative z-20 h-full w-full pl-[17%] pr-4 sm:pr-6 py-3 sm:py-5 flex flex-col">
          
          {/* Cabecera */}
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm sm:text-lg border border-blue-200 shadow-sm">
                SC
              </div>
              <div className="text-[8px] sm:text-[11px] font-black text-blue-800 leading-[1.15] tracking-wide">
                SALUD<br/>CONECTA
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 text-right">
              <div className="flex flex-col items-end justify-center">
                <div className="text-[10px] sm:text-[14px] font-black text-slate-800 tracking-wider">
                  DOCUMENTO DE EMERGENCIA
                </div>
                <div className="text-[7px] sm:text-[9px] font-bold text-slate-500 tracking-[0.1em] mt-0.5">
                  ACCESO INMEDIATO A INFORMACIÓN MÉDICA
                </div>
              </div>
              <div className="text-blue-800 shrink-0">
                <svg className="w-7 h-7 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="currentColor">
                  {/* Cruz de la vida (Star of Life) */}
                  <path d="M10 2h4v5.5l4.8-2.8 2 3.5-4.8 2.8 4.8 2.8-2 3.5-4.8-2.8V22h-4v-5.5l-4.8 2.8-2-3.5 4.8-2.8-4.8-2.8 2-3.5L10 7.5V2z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Cuerpo - Datos del paciente */}
          <div className="flex gap-3 sm:gap-5 mt-1 sm:mt-2">
            {/* Foto del paciente */}
            <div className="rounded-md sm:rounded-lg bg-slate-200 shrink-0 overflow-hidden border border-slate-300 shadow-sm relative z-30" style={{ width: '22%', aspectRatio: '3/4' }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Patient" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                  <span className="text-3xl sm:text-5xl font-bold text-slate-400">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Datos en texto */}
            <div className="flex-1 flex flex-col justify-center relative z-30">
              <div className="text-[7px] sm:text-[10px] text-blue-700 font-bold mb-0.5 sm:mb-1 tracking-wide">NOMBRE COMPLETO</div>
              <div className="text-sm sm:text-xl font-black text-slate-900 leading-[1.1] mb-2 sm:mb-4 uppercase drop-shadow-sm truncate">
                {user.name}
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 sm:gap-y-4 gap-x-2 sm:gap-x-4">
                <div>
                  <div className="text-[7px] sm:text-[10px] text-blue-700 font-bold tracking-wide">FECHA DE NACIMIENTO</div>
                  <div className="text-[10px] sm:text-[13px] font-black text-slate-800">{birthDate}</div>
                </div>
                <div>
                  <div className="text-[7px] sm:text-[10px] text-blue-700 font-bold tracking-wide">LUGAR DE NACIMIENTO</div>
                  <div className="text-[10px] sm:text-[13px] font-black text-slate-800 truncate pr-2">{placeOfBirth}</div>
                </div>
                <div>
                  <div className="text-[7px] sm:text-[10px] text-blue-700 font-bold tracking-wide">SEXO</div>
                  <div className="text-[10px] sm:text-[13px] font-black text-slate-800">NO ESP.</div>
                </div>
                <div>
                  <div className="text-[7px] sm:text-[10px] text-blue-700 font-bold tracking-wide">NÚMERO DE IDENTIDAD</div>
                  <div className="text-[10px] sm:text-[13px] font-black text-slate-800">{cedula.toUpperCase() || "NO REGISTRADO"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de página */}
          <div className="mt-auto pt-2 sm:pt-4 flex justify-between items-end relative z-30">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="text-blue-800 shrink-0">
                {/* Escudo protector con cruz */}
                <svg className="w-5 h-5 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <div className="text-[6px] sm:text-[8px] text-slate-700 leading-tight">
                <span className="font-black text-slate-900">USO EXCLUSIVO EN SITUACIONES DE EMERGENCIA</span><br/>
                Este documento no sustituye la cédula de identidad.
              </div>
            </div>
            
            <div className="text-right pb-0.5 sm:pb-1">
              <div className="text-[5px] sm:text-[7px] font-black text-blue-900/80 tracking-widest">
                SALUD QUE TE CONECTA, VIDA QUE TE ACOMPAÑA
              </div>
              <div className="text-[8px] sm:text-[12px] font-black text-blue-700 tracking-[0.2em] mt-0.5">
                SALUD CONECTA
              </div>
              {/* Línea decorativa */}
              <div className="w-full h-[1.5px] sm:h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent mt-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
