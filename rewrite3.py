import sys

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_str = '  const downloadQRCode = () => {'
    end_str = '  };\n\n  // ═══════════════════════════════════════════════════════════\n  //  Helper functions for converting DOM elements/URLs to PNG'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find boundaries")
        sys.exit(1)
        
    new_func = """  const downloadQRCode = () => {
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

        // Crear contenedor temporal invisible pero dentro del DOM válido
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.top = "0";
        tempContainer.style.left = "0";
        tempContainer.style.opacity = "0";
        tempContainer.style.pointerEvents = "none";
        tempContainer.style.zIndex = "-9999";
        tempContainer.style.width = "840px";
        tempContainer.style.display = "flex";
        tempContainer.style.flexDirection = "column";
        tempContainer.style.gap = "40px";
        tempContainer.style.backgroundColor = "#ffffff";
        tempContainer.style.padding = "20px";
        
        // Clonar
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
        const imgData = await htmlToImage.toPng(tempContainer, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: true,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });

        document.body.removeChild(tempContainer);
        
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
        // Si falló, intentar limpiar el DOM por si acaso
        const temp = document.body.lastChild as HTMLElement;
        if (temp && temp.style.opacity === "0") {
            document.body.removeChild(temp);
        }
      }
    }).catch(err => {
      console.error("Error cargando módulos PDF", err);
      alert("Error cargando los módulos necesarios para generar el PDF.");
    });
"""
    
    new_content = content[:start_idx] + new_func + content[end_idx:]
    with open('src/components/PerfilView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")

if __name__ == '__main__':
    main()
