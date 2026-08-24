import sys
import re

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to replace the style definition of tempContainer.
    old_style = """        // Crear contenedor temporal 100% visible pero sobre el overlay
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.top = "50%";
        tempContainer.style.left = "50%";
        tempContainer.style.transform = "translate(-50%, -50%) scale(0.6)";
        tempContainer.style.zIndex = "999999";
        tempContainer.style.width = "840px";
        tempContainer.style.display = "flex";"""
        
    new_style = """        // Crear contenedor temporal 100% visible pero detrás del overlay
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.top = "0";
        tempContainer.style.left = "0";
        // Sin transform ni scale, esto arruinaba las coordenadas del lienzo
        tempContainer.style.zIndex = "999997"; // Debajo del overlay (999998)
        tempContainer.style.width = "840px";
        tempContainer.style.display = "flex";"""

    if old_style not in content:
        print("Could not find the target string to replace.")
        sys.exit(1)

    content = content.replace(old_style, new_style)
    
    with open('src/components/PerfilView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
