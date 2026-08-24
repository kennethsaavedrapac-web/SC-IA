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
                   <div className="absolute top-[-30%] left-[10%] w-[150%] h-[150%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-20%] left-[20%] w-[130%] h-[130%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-10%] left-[30%] w-[110%] h-[110%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[0%] left-[40%] w-[90%] h-[90%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   
                   {/* Volcanes (SVG) */}
                   <svg className="absolute bottom-6 w-full h-24 opacity-30" viewBox="0 0 100 30" preserveAspectRatio="none">
                     <path d="M0,30 L25,10 L45,30 Z" fill="#1e3a8a" />
                     <path d="M30,30 L60,5 L85,30 Z" fill="#1e3a8a" />
                     <path d="M65,30 L85,15 L100,30 Z" fill="#1e3a8a" />
                     <rect x="0" y="28" width="100" height="2" fill="#0D9488" />
                   </svg>
                </div>

                {/* Banda Lateral */}
                <div className="w-[18%] sm:w-[22%] h-full flex z-10 relative">
                  <div className="w-[20%] h-full bg-[#1e3a8a]"></div>
                  <div className="w-[80%] h-full bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#0D9488] rounded-r-[30px] sm:rounded-r-[50px] shadow-[2px_0_15px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Coat_of_arms_of_Nicaragua.svg" className="w-12 h-12 sm:w-20 sm:h-20 -rotate-90 opacity-90 brightness-0 invert filter" alt="Escudo Nicaragua" />
                  </div>
                </div>

                {/* Contenido */}
                <div className="w-[82%] sm:w-[78%] h-full p-3 sm:p-5 flex flex-col z-10 relative bg-white/70 backdrop-blur-[2px]">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2 sm:mb-4 w-full">
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-transparent shrink-0">
                         <img src="/app-logo-v2.jpg" alt="Salud Conecta" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="text-[#0D9488] font-bold text-[6px] sm:text-[10px] leading-[1.1] tracking-widest shrink-0">
                        SALUD<br/>CONECTA
                      </div>
                    </div>
                    
                    <div className="text-center flex-1 mx-1 sm:mx-4">
                      <h2 className="text-[#1e3a8a] font-bold text-[9px] sm:text-[16px] tracking-wider uppercase leading-tight whitespace-nowrap">DOCUMENTO DE EMERGENCIA</h2>
                      <p className="text-slate-600 text-[5px] sm:text-[8px] font-semibold tracking-wide uppercase mt-0.5">Acceso inmediato a información médica</p>
                    </div>
                    
                    <div className="shrink-0 flex items-start">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/f/f4/Star_of_life2.svg" className="w-6 h-6 sm:w-10 sm:h-10" alt="Star of Life" />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-row gap-2 sm:gap-5 flex-1 items-start mt-1 sm:mt-2 w-full">
                    
                    {/* Foto */}
                    <div className="w-[60px] sm:w-[100px] shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Foto" className="w-full aspect-[3/4] object-cover bg-slate-200 rounded-sm shadow-sm" />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-slate-200 flex items-center justify-center text-xl sm:text-3xl text-slate-400 font-bold rounded-sm shadow-sm">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-start text-left pl-1 sm:pl-2">
                      <div className="mb-2 sm:mb-4 border-b border-slate-200/50 pb-1 sm:pb-2">
                        <p className="text-slate-500 font-bold text-[5px] sm:text-[8px] mb-0 sm:mb-1 uppercase tracking-wide">Nombre Completo</p>
                        <h3 className="text-[#1e3a8a] font-bold text-[11px] sm:text-[20px] tracking-wide leading-tight">{displayName}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 sm:gap-y-4 gap-x-2 sm:gap-x-4">
                        <div>
                          <p className="text-[#0D9488] font-bold text-[5px] sm:text-[8px] tracking-wide">FECHA DE NACIMIENTO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-[13px]">
                            {user.birthDate ? user.birthDate.split('-').reverse().join('-') : '---'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#0D9488] font-bold text-[5px] sm:text-[8px] tracking-wide">LUGAR DE NACIMIENTO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-[13px] uppercase">{user.city || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#0D9488] font-bold text-[5px] sm:text-[8px] tracking-wide">SEXO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-[13px] uppercase">{user.sex === 'male' ? 'M' : user.sex === 'female' ? 'F' : '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#0D9488] font-bold text-[5px] sm:text-[8px] tracking-wide">NÚMERO DE IDENTIDAD</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-[13px] uppercase">{localMedicalData.cedula || '---'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex justify-between items-end pb-0 sm:pb-1 pt-2 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div className="w-4 h-4 sm:w-7 sm:h-7 border-[1.5px] sm:border-2 border-[#1e3a8a] rounded-sm sm:rounded-md flex items-center justify-center text-[#1e3a8a]">
                        <span className="font-bold text-[10px] sm:text-[16px] leading-none mb-[1px]">+</span>
                      </div>
                      <div>
                        <p className="text-[#0f172a] font-bold text-[4px] sm:text-[7px] tracking-widest uppercase">
                          Uso exclusivo en situaciones de emergencia
                        </p>
                        <p className="text-slate-600 text-[4px] sm:text-[6px] mt-[1px]">
                          Este documento no sustituye la cédula de identidad.
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[#1e3a8a] font-bold text-[4px] sm:text-[6px] tracking-wider mb-[2px]">
                        SALUD QUE TE CONECTA, VIDA QUE TE ACOMPAÑA
                      </p>
                      <div className="h-[1px] w-full bg-slate-300 relative my-[2px]">
                         <div className="absolute left-1/2 -translate-x-1/2 -top-[3px] sm:-top-[5px] bg-white px-1 sm:px-2">
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

    # Define the new back face
    new_back = """
              {/* Cara Trasera - Datos Médicos */}
              <div id="card-back-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-50 rounded-[12px] sm:rounded-[20px] overflow-hidden shadow-2xl flex border border-slate-200">
                
                {/* Fondo Decorativo */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                   {/* Ondas (Círculos concéntricos) */}
                   <div className="absolute top-[-30%] left-[10%] w-[150%] h-[150%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-20%] left-[20%] w-[130%] h-[130%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   <div className="absolute top-[-10%] left-[30%] w-[110%] h-[110%] rounded-full border-[0.5px] border-[#1e3a8a]/10" />
                   
                   {/* Volcanes (SVG) */}
                   <svg className="absolute bottom-6 w-full h-24 opacity-30" viewBox="0 0 100 30" preserveAspectRatio="none">
                     <path d="M0,30 L25,10 L45,30 Z" fill="#1e3a8a" />
                     <path d="M30,30 L60,5 L85,30 Z" fill="#1e3a8a" />
                     <path d="M65,30 L85,15 L100,30 Z" fill="#1e3a8a" />
                     <rect x="0" y="28" width="100" height="2" fill="#0D9488" />
                   </svg>
                </div>

                {/* Banda Lateral */}
                <div className="w-[18%] sm:w-[22%] h-full flex z-10 relative">
                  <div className="w-[20%] h-full bg-[#1e3a8a]"></div>
                  <div className="w-[80%] h-full bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#0D9488] rounded-r-[30px] sm:rounded-r-[50px] shadow-[2px_0_15px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Coat_of_arms_of_Nicaragua.svg" className="w-12 h-12 sm:w-20 sm:h-20 -rotate-90 opacity-90 brightness-0 invert filter" alt="Escudo Nicaragua" />
                  </div>
                </div>

                {/* Contenido Principal */}
                <div className="w-[82%] sm:w-[78%] h-full p-3 sm:p-5 flex flex-col z-10 relative bg-white/70 backdrop-blur-[2px]">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2 sm:mb-4 w-full">
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-transparent shrink-0">
                         <img src="/app-logo-v2.jpg" alt="Salud Conecta" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="text-[#0D9488] font-bold text-[6px] sm:text-[10px] leading-[1.1] tracking-widest shrink-0">
                        SALUD<br/>CONECTA
                      </div>
                    </div>
                    
                    <div className="text-center flex-1 mx-1 sm:mx-4">
                      <h2 className="text-[#1e3a8a] font-bold text-[9px] sm:text-[16px] tracking-wider uppercase leading-tight whitespace-nowrap">DATOS MÉDICOS DE EMERGENCIA</h2>
                      <p className="text-slate-600 text-[5px] sm:text-[8px] font-semibold tracking-wide uppercase mt-0.5">Atención: {displayName}</p>
                    </div>
                    
                    <div className="shrink-0 flex items-start">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/f/f4/Star_of_life2.svg" className="w-6 h-6 sm:w-10 sm:h-10" alt="Star of Life" />
                    </div>
                  </div>

                  {/* Body - Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1.5 sm:gap-y-3 w-full">
                    
                    <div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                          <Heart className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                        <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">Enfermedades</p>
                      </div>
                      <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 min-h-[16px] sm:min-h-[28px] text-slate-800 text-[7px] sm:text-[11px] font-semibold leading-tight">
                        {localMedicalData.enfermedades || 'Ninguna'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                          <Activity className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                        <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">Alergias</p>
                      </div>
                      <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 min-h-[16px] sm:min-h-[28px] text-slate-800 text-[7px] sm:text-[11px] font-semibold leading-tight">
                        {localMedicalData.alergias || 'Ninguna'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                          <Droplets className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                        <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">Tipo de Sangre</p>
                      </div>
                      <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 min-h-[16px] sm:min-h-[28px] text-slate-800 text-[7px] sm:text-[11px] font-semibold leading-tight">
                        {localMedicalData.tipoSangre || user.bloodType || 'O+'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                          <Activity className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                        <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">Tratamientos</p>
                      </div>
                      <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 min-h-[16px] sm:min-h-[28px] text-slate-800 text-[7px] sm:text-[11px] font-semibold line-clamp-2 leading-tight">
                        {localMedicalData.tratamientos || localMedicalData.pastillas || 'Ninguno'}
                      </div>
                    </div>
                  </div>

                  {/* Contacto de Emergencia */}
                  <div className="mt-1 sm:mt-2 w-full">
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-[1px] sm:mb-1">
                      <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a]">
                        <User className="w-2 h-2 sm:w-3 sm:h-3" />
                      </div>
                      <p className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide">CONTACTO DE EMERGENCIA</p>
                    </div>
                    <div className="bg-white/80 border border-slate-200 shadow-sm rounded p-1 sm:p-2 text-slate-800 text-[7px] sm:text-[11px] font-semibold flex items-center">
                      <span className="font-bold mr-2 text-[#0D9488]">Teléfono:</span> {localMedicalData.contactoEmergencia || user.emergencyPhone || '---'}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="mt-auto flex justify-end items-end pb-0 sm:pb-1 pt-1 w-full">
                    <div className="text-right flex flex-col items-end w-full">
                      <p className="text-[#1e3a8a] font-bold text-[4px] sm:text-[6px] tracking-wider mb-[2px]">
                        SALUD QUE TE CONECTA, VIDA QUE TE ACOMPAÑA
                      </p>
                      <div className="h-[1px] w-full bg-slate-300 relative my-[2px]">
                         <div className="absolute left-1/2 -translate-x-1/2 -top-[3px] sm:-top-[5px] bg-white px-1 sm:px-2">
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
    
    start_back = '              {/* Cara Trasera - Datos Médicos */}'
    end_back = '            </div>\n          </div>\n        </section>'
    
    idx_f_s = content.find(start_front)
    idx_f_e = content.find(end_front)
    idx_b_s = content.find(start_back)
    idx_b_e = content.find(end_back)
    
    if idx_f_s == -1 or idx_f_e == -1 or idx_b_e == -1:
        print("Could not find card faces boundaries")
        sys.exit(1)
        
    content = content[:idx_f_s] + new_front + new_back + content[idx_b_e:]

    # Replace downloadQRCode
    start_dl = '  const downloadQRCode = () => {'
    end_dl = '  };\n\n  // ═══════════════════════════════════════════════════════════\n  //  Helper functions for converting DOM elements/URLs to PNG'
    
    idx_dl_s = content.find(start_dl)
    idx_dl_e = content.find(end_dl)
    
    if idx_dl_s == -1 or idx_dl_e == -1:
        print("Could not find downloadQRCode boundaries")
        sys.exit(1)
        
    new_dl = """  const downloadQRCode = () => {
    Promise.all([
      import("jspdf"),
      import("html-to-image")
    ]).then(async ([{ default: jsPDF }, htmlToImage]) => {
      try {
        const frontEl = document.getElementById("card-front-face");
        const backEl = document.getElementById("card-back-face");
        if (!frontEl || !backEl) {
          alert("Error: No se encontraron los elementos de la tarjeta en la pantalla.");
          return;
        }

        // Crear un overlay oscuro de carga
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
        overlay.style.zIndex = "999998";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        
        const loaderText = document.createElement("h2");
        loaderText.innerText = "Generando documento...";
        loaderText.style.color = "#1e3a8a";
        loaderText.style.fontFamily = "system-ui, sans-serif";
        loaderText.style.fontSize = "24px";
        loaderText.style.fontWeight = "bold";
        loaderText.style.marginBottom = "30px";
        overlay.appendChild(loaderText);
        document.body.appendChild(overlay);

        // Crear contenedor temporal 100% visible pero sobre el overlay
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.top = "50%";
        tempContainer.style.left = "50%";
        tempContainer.style.transform = "translate(-50%, -50%) scale(0.6)";
        tempContainer.style.zIndex = "999999";
        tempContainer.style.width = "840px";
        tempContainer.style.display = "flex";
        tempContainer.style.flexDirection = "column";
        tempContainer.style.gap = "40px";
        tempContainer.style.backgroundColor = "transparent";
        tempContainer.style.padding = "20px";
        
        // Clonar nodos
        const frontClone = frontEl.cloneNode(true) as HTMLElement;
        const backClone = backEl.cloneNode(true) as HTMLElement;
        
        // Quitar estilos 3D
        frontClone.style.backfaceVisibility = "visible";
        frontClone.style.transform = "none";
        frontClone.style.position = "relative";
        frontClone.style.inset = "auto";
        frontClone.style.width = "800px";
        frontClone.style.height = "504px";
        
        backClone.style.backfaceVisibility = "visible";
        backClone.style.transform = "none";
        backClone.style.position = "relative";
        backClone.style.inset = "auto";
        backClone.style.width = "800px";
        backClone.style.height = "504px";

        tempContainer.appendChild(frontClone);
        tempContainer.appendChild(backClone);
        document.body.appendChild(tempContainer);

        // Renderizar con html-to-image (soporta oklch nativamente via SVG)
        // Damos un timeout pequeñito para asegurar que los clones se montaron y cargaron imgs
        await new Promise(r => setTimeout(r, 200));

        const imgData = await htmlToImage.toPng(tempContainer, {
          pixelRatio: 2,
          backgroundColor: "rgba(255,255,255,1)",
          cacheBust: true,
        });

        // Limpieza de UI
        document.body.removeChild(tempContainer);
        document.body.removeChild(overlay);
        
        // Obtener dimensiones reales de la imagen
        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => { img.onload = resolve; });
        
        // Crear PDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const marginX = 10;
        const printWidth = pdfWidth - (marginX * 2);
        const printHeight = (img.height * printWidth) / img.width;

        pdf.addImage(imgData, "PNG", marginX, 15, printWidth, printHeight);
        pdf.save(`Documento-Emergencia-${user.name || "perfil"}.pdf`);
      } catch (err) {
        console.error("Error generando PDF", err);
        alert("Ocurrió un error al generar el PDF: " + (err as Error).message);
        
        // Limpieza de emergencia
        const temp = document.body.lastChild as HTMLElement;
        if (temp) document.body.removeChild(temp);
      }
    }).catch(err => {
      console.error("Error cargando módulos PDF", err);
      alert("Error cargando los módulos necesarios para generar el PDF.");
    });
"""

    content = content[:idx_dl_s] + new_dl + content[idx_dl_e:]
    
    with open('src/components/PerfilView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
