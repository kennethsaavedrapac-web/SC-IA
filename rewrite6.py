import sys
import re

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the new front face
    new_front = """
              {/* Cara Frontal - Datos Personales */}
              <div id="card-front-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-slate-50 rounded-[12px] sm:rounded-[20px] overflow-hidden shadow-2xl flex border border-slate-200">
                
                {/* Fondo Decorativo */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                   {/* Ondas (Círculos concéntricos) */}
                   <div className="absolute top-[-40%] left-[5%] w-[160%] h-[160%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-30%] left-[15%] w-[140%] h-[140%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-20%] left-[25%] w-[120%] h-[120%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-10%] left-[35%] w-[100%] h-[100%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   
                   {/* Volcanes (SVG) */}
                   <svg className="absolute bottom-4 sm:bottom-6 w-[120%] left-[-10%] h-32 sm:h-48 opacity-[0.12]" viewBox="0 0 100 40" preserveAspectRatio="none">
                     <path d="M-10,40 L15,20 L40,40 Z" fill="#1e3a8a" />
                     <path d="M10,40 L40,5 L70,40 Z" fill="#1e3a8a" />
                     <path d="M50,40 L80,15 L110,40 Z" fill="#1e3a8a" />
                     <rect x="0" y="38" width="100" height="2" fill="#0D9488" />
                   </svg>
                </div>

                {/* Banda Lateral */}
                <div className="w-[18%] sm:w-[22%] h-full flex z-10 relative">
                  <div className="w-[20%] h-full bg-[#1e3a8a]"></div>
                  <div className="w-[80%] h-full bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#0D9488] rounded-r-[30px] sm:rounded-r-[50px] shadow-[2px_0_15px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="relative w-[85%] max-w-[120px] aspect-square flex items-center justify-center">
                      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full hidden sm:block" aria-hidden="true">
                        <defs>
                          <path id="scNicArcTop" d="M60,60 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" fill="none" />
                          <path id="scNicArcBottom" d="M12,60 a48,48 0 0,0 96,0" fill="none" />
                        </defs>
                        <text fill="#ffffff" fontSize="9" fontWeight="700" letterSpacing="1.5" style={{ fontFamily: "system-ui, sans-serif" }}>
                          <textPath href="#scNicArcTop" startOffset="3%">REPÚBLICA DE NICARAGUA</textPath>
                        </text>
                        <text fill="#ffffff" fontSize="9" fontWeight="700" letterSpacing="1.5" style={{ fontFamily: "system-ui, sans-serif" }}>
                          <textPath href="#scNicArcBottom" startOffset="10%">AMÉRICA CENTRAL</textPath>
                        </text>
                      </svg>
                      <img src="/escudo.svg" className="w-[45%] sm:w-[50%] aspect-square -rotate-90 opacity-100 brightness-0 invert filter relative z-10" alt="Escudo Nicaragua" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="w-[82%] sm:w-[78%] h-full p-3 sm:p-5 flex flex-col z-10 relative bg-white/60 backdrop-blur-[1px]">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-1 sm:mb-2 w-full">
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-transparent shrink-0">
                         <img src="/app-logo-v2.jpg" alt="Salud Conecta" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="text-[#0D9488] font-bold text-[6px] sm:text-[10px] leading-[1.1] tracking-widest shrink-0">
                        SALUD<br/>CONECTA
                      </div>
                    </div>
                    
                    <div className="text-center flex-1 mx-1 sm:mx-4 mt-0.5 sm:mt-1">
                      <h2 className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] tracking-wider uppercase leading-tight whitespace-nowrap">DOCUMENTO DE EMERGENCIA</h2>
                      <p className="text-slate-600 text-[5px] sm:text-[8px] font-semibold tracking-wide uppercase mt-[2px] sm:mt-1">Acceso inmediato a información médica</p>
                    </div>
                    
                    <div className="shrink-0 flex items-start">
                      <img src="/star-of-life.svg" className="w-6 h-6 sm:w-10 sm:h-10 opacity-90" alt="Star of Life" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-row gap-2 sm:gap-4 flex-1 items-start mt-2 sm:mt-4 w-full relative">
                    
                    {/* Foto */}
                    <div className="w-[60px] sm:w-[100px] shrink-0 self-start">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Foto" className="w-full aspect-[3/4] object-cover bg-slate-200 rounded-sm shadow-md" />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-slate-200 flex items-center justify-center text-xl sm:text-3xl text-slate-400 font-bold rounded-sm shadow-md">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-start text-left pl-1 sm:pl-2">
                      <div className="mb-2 sm:mb-5 pb-1">
                        <p className="text-[#0f172a] font-bold text-[5px] sm:text-[8px] mb-0 sm:mb-1 uppercase tracking-wide">NOMBRE COMPLETO</p>
                        <h3 className="text-[#0f172a] font-bold text-[12px] sm:text-[22px] tracking-wide leading-tight">{displayName}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 sm:gap-y-5 gap-x-2 sm:gap-x-4 max-w-[80%]">
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] tracking-wide uppercase">FECHA DE NACIMIENTO</p>
                          <p className="text-[#0f172a] font-bold text-[8px] sm:text-[13px]">
                            {user.birthDate ? user.birthDate.split('-').reverse().join('-') : '---'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] tracking-wide uppercase">LUGAR DE NACIMIENTO</p>
                          <p className="text-[#0f172a] font-bold text-[8px] sm:text-[13px] uppercase">{user.city || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] tracking-wide uppercase">SEXO</p>
                          <p className="text-[#0f172a] font-bold text-[8px] sm:text-[13px] uppercase">{user.sex === 'male' ? 'M' : user.sex === 'female' ? 'F' : '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] tracking-wide uppercase">NÚMERO DE IDENTIDAD</p>
                          <p className="text-[#0f172a] font-bold text-[8px] sm:text-[13px] uppercase">{localMedicalData.cedula || '---'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Caja País de Residencia */}
                    <div className="absolute right-0 bottom-6 sm:bottom-12 flex flex-col items-center">
                       <div className="bg-[#0f3b73] rounded sm:rounded-lg px-2 py-1.5 sm:px-4 sm:py-3 text-center shadow-lg w-[70px] sm:w-[130px]">
                         <p className="text-white/90 font-semibold text-[4px] sm:text-[7px] tracking-widest uppercase mb-0.5 sm:mb-1">PAÍS DE RESIDENCIA</p>
                         <p className="text-white font-bold text-[6px] sm:text-[12px] tracking-wider uppercase">NICARAGUA</p>
                       </div>
                    </div>
                    
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex justify-between items-end pb-0 sm:pb-1 pt-2 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div className="w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center text-[#1e3a8a] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.5" />
                           <path d="M12 8v8" strokeWidth="2.5" strokeLinecap="round" />
                           <path d="M8 12h8" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#0f172a] font-bold text-[4px] sm:text-[7px] tracking-widest uppercase leading-[1.2]">
                          Uso exclusivo en<br/>situaciones de emergencia
                        </p>
                        <p className="text-slate-600 text-[4px] sm:text-[6px] mt-[2px] leading-[1.2]">
                          Este documento no sustituye<br/>la cédula de identidad.
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[#0f172a] font-bold text-[4px] sm:text-[6px] tracking-wider mb-[2px]">
                        SALUD QUE TE CONECTA, VIDA QUE TE ACOMPAÑA
                      </p>
                      <div className="h-[1.5px] w-full bg-slate-400 relative my-[2px]">
                         <div className="absolute left-1/2 -translate-x-1/2 -top-[3px] sm:-top-[4px] bg-white px-1 sm:px-2">
                           <p className="text-[#0D9488] font-bold text-[5px] sm:text-[7px] tracking-widest">
                             SALUD CONECTA
                           </p>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
"""

    start_front = '              {/* Cara Frontal - Datos Personales */}'
    end_front = '              {/* Cara Trasera - Datos Médicos */}'
    
    idx_f_s = content.find(start_front)
    idx_f_e = content.find(end_front)
    
    if idx_f_s == -1 or idx_f_e == -1:
        print("Could not find front face boundaries")
        sys.exit(1)
        
    content = content[:idx_f_s] + new_front + content[idx_f_e:]

    with open('src/components/PerfilView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
