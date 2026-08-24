import sys
import re

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

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
        loaderText.innerText = "Generando documento PDF...";
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
        await new Promise(r => setTimeout(r, 300));

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
