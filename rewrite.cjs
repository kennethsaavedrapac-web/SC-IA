const fs = require('fs');
let content = fs.readFileSync('src/components/PerfilView.tsx', 'utf-8');

// Add ids to faces
content = content.replace(
  '<div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">',
  '<div id="card-front-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">'
);

content = content.replace(
  '<div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">',
  '<div id="card-back-face" className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex border border-slate-200">'
);

// Replace downloadQRCode
const startStr = '  const downloadQRCode = () => {';
const endStr = '  };\n\n  // ═══════════════════════════════════════════════════════════\n  //  Helper functions for converting DOM elements/URLs to PNG';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newFunc = `  const downloadQRCode = () => {
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
        pdf.save(\`Documento-Emergencia-\${user.name || "perfil"}.pdf\`);
      } catch (err) {
        console.error("Error generando PDF", err);
      }
    }).catch(err => {
      console.error("Error cargando módulos PDF", err);
    });
  };\n\n`;
  
  content = content.substring(0, startIndex) + newFunc + content.substring(endIndex + endStr.length - '  // ═══════════════════════════════════════════════════════════\n  //  Helper functions for converting DOM elements/URLs to PNG'.length);
  fs.writeFileSync('src/components/PerfilView.tsx', content);
  console.log('Success');
} else {
  console.log('Could not find boundaries');
}
