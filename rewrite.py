import sys

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add front face ID
    old_front = '<div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">'
    new_front = '<div id="card-front-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">'
    content = content.replace(old_front, new_front)
    
    # 2. Add back face ID
    old_back = '<div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">'
    new_back = '<div id="card-back-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">'
    content = content.replace(old_back, new_back)
    
    # 3. Replace function
    start_str = '  const downloadQRCode = () => {\n    import("jspdf").then(async ({ default: jsPDF }) => {'
    end_str = '  };\n\n  // ═══════════════════════════════════════════════════════════\n  //  Helper functions for converting DOM elements/URLs to PNG'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find boundaries")
        sys.exit(1)
        
    new_func = """  const downloadQRCode = () => {
    Promise.all([
      import("jspdf"),
      import("html2canvas")
    ]).then(async ([{ default: jsPDF }, { default: html2canvas }]) => {
      try {
        const frontEl = document.getElementById("card-front-face");
        const backEl = document.getElementById("card-back-face");
        if (!frontEl || !backEl) return;

        // Crear contenedor temporal fuera de pantalla
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.top = "-9999px";
        tempContainer.style.left = "-9999px";
        tempContainer.style.width = "840px";
        tempContainer.style.display = "flex";
        tempContainer.style.flexDirection = "column";
        tempContainer.style.gap = "40px";
        tempContainer.style.backgroundColor = "#ffffff";
        tempContainer.style.padding = "20px";
        
        // Clonar
        const frontClone = frontEl.cloneNode(true);
        const backClone = backEl.cloneNode(true);
        
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

        // Renderizar con html2canvas
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        document.body.removeChild(tempContainer);
        const imgData = canvas.toDataURL("image/png");
        
        // Crear PDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const marginX = 10;
        const printWidth = pdfWidth - (marginX * 2);
        const printHeight = (canvas.height * printWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", marginX, 15, printWidth, printHeight);
        pdf.save(`Documento-Emergencia-${user.name || "perfil"}.pdf`);
      } catch (err) {
        console.error("Error generando PDF", err);
      }
    }).catch(err => {
      console.error("Error cargando módulos PDF", err);
    });
"""
    
    new_content = content[:start_idx] + new_func + content[end_idx:]
    with open('src/components/PerfilView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")

if __name__ == '__main__':
    main()
