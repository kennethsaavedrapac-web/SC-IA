import sys

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # The block to replace in both the front and back faces:
    old_block = """<div className="relative w-[90%] max-w-[140px] aspect-square flex items-center justify-center">
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
                    </div>"""
                    
    new_block = """<div className="relative w-[85%] max-w-[140px] aspect-square flex items-center justify-center">
                      <img src="/escudo_completo.png" className="w-full h-full object-contain -rotate-90 opacity-90 brightness-0 invert filter" alt="Escudo Nicaragua" />
                    </div>"""

    content = content.replace(old_block, new_block)
    
    with open('src/components/PerfilView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
