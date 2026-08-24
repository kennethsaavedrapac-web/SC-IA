import sys

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    new_front = """
              {/* Cara Frontal - Datos Personales */}
              <div id="card-front-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-slate-50 rounded-[12px] sm:rounded-[24px] overflow-hidden shadow-2xl flex border-2 border-slate-200">
                
                {/* Fondo Decorativo */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                   {/* Ondas (Círculos concéntricos) */}
                   <div className="absolute top-[-50%] left-[0%] w-[180%] h-[180%] rounded-full border-[1px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-35%] left-[10%] w-[150%] h-[150%] rounded-full border-[1px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-20%] left-[20%] w-[120%] h-[120%] rounded-full border-[1px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-5%] left-[30%] w-[90%] h-[90%] rounded-full border-[1px] border-[#1e3a8a]/10" />
                   
                   {/* Volcanes (SVG) */}
                   <svg className="absolute bottom-6 sm:bottom-8 w-[120%] left-[-10%] h-40 sm:h-64 opacity-[0.10]" viewBox="0 0 100 40" preserveAspectRatio="none">
                     <path d="M-10,40 L15,20 L40,40 Z" fill="#1e3a8a" />
                     <path d="M10,40 L40,5 L70,40 Z" fill="#1e3a8a" />
                     <path d="M50,40 L80,15 L110,40 Z" fill="#1e3a8a" />
                     <rect x="0" y="38" width="100" height="2" fill="#0D9488" />
                   </svg>
                </div>

                {/* Banda Lateral */}
                <div className="w-[18%] sm:w-[22%] h-full flex z-10 relative">
                  <div className="w-[15%] h-full bg-[#1e3a8a]"></div>
                  <div className="w-[85%] h-full bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#0D9488] rounded-r-[30px] sm:rounded-r-[60px] shadow-[2px_0_15px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="relative w-[90%] max-w-[140px] aspect-square flex items-center justify-center">
                      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full hidden sm:block" aria-hidden="true">
                        <defs>
                          <path id="scNicArcTop" d="M60,60 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" fill="none" />
                          <path id="scNicArcBottom" d="M10,60 a50,50 0 0,0 100,0" fill="none" />
                        </defs>
                        <text fill="#ffffff" fontSize="10" fontWeight="700" letterSpacing="1.5" style={{ fontFamily: "system-ui, sans-serif" }}>
                          <textPath href="#scNicArcTop" startOffset="3%">REPÚBLICA DE NICARAGUA</textPath>
                        </text>
                        <text fill="#ffffff" fontSize="10" fontWeight="700" letterSpacing="1.5" style={{ fontFamily: "system-ui, sans-serif" }}>
                          <textPath href="#scNicArcBottom" startOffset="8%">AMÉRICA CENTRAL</textPath>
                        </text>
                      </svg>
                      {/* En la foto 1, el escudo está rotado -90. En la foto 2, está rotado -90 también! Wait no, en la foto 1 el escudo está rotado -90, vamos a dejarlo derecho por si acaso */}
                      <img src="/escudo.svg" className="w-[50%] sm:w-[55%] aspect-square opacity-100 brightness-0 invert filter relative z-10" alt="Escudo Nicaragua" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="w-[82%] sm:w-[78%] h-full p-4 sm:p-8 flex flex-col z-10 relative bg-white/50 backdrop-blur-[1px]">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center mb-2 sm:mb-6 w-full">
                    <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                      <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-transparent shrink-0">
                         <img src="/app-logo-v2.jpg" alt="Salud Conecta" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="text-[#0D9488] font-bold text-[8px] sm:text-[14px] leading-[1.1] tracking-widest shrink-0">
                        SALUD<br/>CONECTA
                      </div>
                    </div>
                    
                    <div className="text-center flex-1 mx-2 sm:mx-4">
                      <h2 className="text-[#0f172a] font-bold text-[12px] sm:text-[26px] tracking-wider uppercase leading-tight whitespace-nowrap">DOCUMENTO DE EMERGENCIA</h2>
                      <p className="text-slate-600 text-[6px] sm:text-[11px] font-semibold tracking-widest uppercase mt-[2px] sm:mt-1">Acceso inmediato a información médica</p>
                    </div>
                    
                    <div className="shrink-0 flex items-start">
                      <img src="/star-of-life.svg" className="w-8 h-8 sm:w-14 sm:h-14 opacity-90" alt="Star of Life" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-row gap-3 sm:gap-6 flex-1 items-start mt-2 sm:mt-6 w-full relative">
                    
                    {/* Foto */}
                    <div className="w-[75px] sm:w-[140px] shrink-0 self-start border-[3px] border-white shadow-lg rounded-md overflow-hidden bg-slate-200">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Foto" className="w-full aspect-[3/4] object-cover" />
                      ) : (
                        <div className="w-full aspect-[3/4] flex items-center justify-center text-2xl sm:text-5xl text-slate-400 font-bold">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-start text-left pl-1 sm:pl-3">
                      <div className="mb-3 sm:mb-8 pb-1">
                        <p className="text-[#0f172a] font-bold text-[6px] sm:text-[11px] mb-0 sm:mb-1 uppercase tracking-wider">NOMBRE COMPLETO</p>
                        <h3 className="text-[#0f172a] font-bold text-[14px] sm:text-[32px] tracking-wide leading-none">{displayName}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-3 sm:gap-y-8 gap-x-3 sm:gap-x-6 max-w-[85%]">
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-[11px] tracking-wider uppercase mb-0.5">FECHA DE NACIMIENTO</p>
                          <p className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] leading-none">
                            {user.birthDate ? user.birthDate.split('-').reverse().join('-') : '---'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-[11px] tracking-wider uppercase mb-0.5">LUGAR DE NACIMIENTO</p>
                          <p className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] uppercase leading-none">{user.city || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-[11px] tracking-wider uppercase mb-0.5">SEXO</p>
                          <p className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] uppercase leading-none">{user.sex === 'male' ? 'M' : user.sex === 'female' ? 'F' : '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-[11px] tracking-wider uppercase mb-0.5">NÚMERO DE IDENTIDAD</p>
                          <p className="text-[#0f172a] font-bold text-[10px] sm:text-[18px] uppercase leading-none">{localMedicalData.cedula || '---'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Caja País de Residencia */}
                    <div className="absolute right-0 bottom-6 sm:bottom-12 flex flex-col items-center">
                       <div className="bg-[#0f3b73] rounded-md sm:rounded-xl px-3 py-2 sm:px-6 sm:py-4 text-center shadow-lg w-[85px] sm:w-[180px]">
                         <p className="text-white/90 font-bold text-[5px] sm:text-[10px] tracking-widest uppercase mb-1 sm:mb-2 leading-none">PAÍS DE RESIDENCIA</p>
                         <p className="text-white font-bold text-[8px] sm:text-[18px] tracking-wider uppercase leading-none">NICARAGUA</p>
                       </div>
                    </div>
                    
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex justify-between items-end pb-0 sm:pb-2 pt-2 sm:pt-4 w-full">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="w-6 h-6 sm:w-12 sm:h-12 flex items-center justify-center text-[#1e3a8a] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.5" />
                           <path d="M12 8v8" strokeWidth="2.5" strokeLinecap="round" />
                           <path d="M8 12h8" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#0f172a] font-bold text-[5px] sm:text-[10px] tracking-widest uppercase leading-[1.2]">
                          Uso exclusivo en<br/>situaciones de emergencia
                        </p>
                        <p className="text-slate-600 text-[4px] sm:text-[8px] mt-[2px] leading-[1.2]">
                          Este documento no sustituye<br/>la cédula de identidad.
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[#0f172a] font-bold text-[5px] sm:text-[9px] tracking-wider mb-[2px] sm:mb-[4px]">
                        SALUD QUE TE CONECTA, VIDA QUE TE ACOMPAÑA
                      </p>
                      <div className="h-[2px] w-full bg-slate-400 relative my-[2px] sm:my-[4px]">
                         <div className="absolute left-1/2 -translate-x-1/2 -top-[4px] sm:-top-[7px] bg-[#f8fafc] px-1 sm:px-3">
                           <p className="text-[#0D9488] font-bold text-[6px] sm:text-[10px] tracking-widest leading-none bg-clip-text">
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
