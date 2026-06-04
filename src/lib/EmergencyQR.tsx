import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { UserProfile } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { ShieldCheck, Download } from "lucide-react";

interface EmergencyQRProps {
  user: UserProfile;
  healthConditions?: string[];
}

/**
 * Componente de Código QR de Emergencia optimizado para legibilidad universal.
 * Utiliza nivel de corrección 'H' y formato SVG para máxima compatibilidad.
 */
export const EmergencyQR: React.FC<EmergencyQRProps> = ({ user, healthConditions = [] }) => {
  const { t } = useLanguage();

  // Estructuramos la información vital de forma compacta para no saturar el QR
  const emergencyData = JSON.stringify({
    n: user.name,
    b: user.bloodType || "No especificado",
    c: healthConditions.length > 0 ? healthConditions.join(", ") : "Ninguna",
    e: user.emergencyPhone || "128", // Número de emergencia local por defecto
    v: new Date().toISOString().split('T')[0] // Fecha de validación para el disclaimer de 24h
  });

  const downloadPDF = () => {
    import("jspdf").then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); // Azul
      doc.text("Tarjeta de Emergencia Médica", 20, 20);

      // Info del usuario
      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85); // Slate
      doc.text(`Nombre: ${user.name}`, 20, 40);
      doc.text(`Tipo de Sangre: ${user.bloodType || "No especificado"}`, 20, 50);
      doc.text(`Contacto de Emergencia: ${user.emergencyPhone || "No especificado"}`, 20, 60);

      // Condiciones médicas
      doc.text("Condiciones Médicas:", 20, 75);
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      if (healthConditions && healthConditions.length > 0) {
        healthConditions.forEach((cond, idx) => {
          doc.text(`• ${cond}`, 25, 85 + (idx * 8));
        });
      } else {
        doc.text("Ninguna registrada.", 25, 85);
      }

      // Añadir QR Code al PDF
      const svg = document.getElementById("emergency-qr-code");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        img.onload = () => {
          canvas.width = 512;
          canvas.height = 512;
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, 512, 512);
          }
          const pngData = canvas.toDataURL("image/png");
          // Añadir la imagen al PDF (x, y, width, height)
          doc.addImage(pngData, 'PNG', 130, 30, 60, 60);
          
          doc.save(`Emergencia-${user.name}.pdf`);
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      } else {
        doc.save(`Emergencia-${user.name}.pdf`);
      }
    }).catch(err => {
      console.error("Error cargando jsPDF", err);
    });
  };

  const downloadQR = () => {
    const svg = document.getElementById("emergency-qr-code");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-Emergencia-${user.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="bg-white p-4 rounded-2xl shadow-inner mb-4">
        <QRCodeSVG
          id="emergency-qr-code"
          value={emergencyData}
          size={220}
          level="H" // Nivel de corrección alto para máxima legibilidad
          includeMargin={true}
          imageSettings={{
            src: "/app-logo-v1.jpg",
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>{t("authorizedOnly")}</span>
        </div>
        <p className="text-[10px] text-slate-400 max-w-[200px] leading-tight">
          {t("qrDisclaimer")}
        </p>
        
        <div className="flex flex-col gap-2 mt-4 w-full px-2">
          <button 
            onClick={downloadPDF}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-sm"
          >
            <Download className="w-4 h-4" />
            Descargar PDF Médico
          </button>
          <button 
            onClick={downloadQR}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-all text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            {t("download")} QR (Imagen)
          </button>
        </div>
      </div>
    </div>
  );
};