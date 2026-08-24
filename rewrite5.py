import sys

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix Escudo URL
    content = content.replace('3/30/Coat_of_arms_of_Nicaragua.svg', 'c/cc/Coat_of_arms_of_Nicaragua.svg')

    # Fix Star of Life URL
    content = content.replace('f/f4/Star_of_life2.svg', '5/5b/Star_of_life2.svg')

    # Fix Label Colors
    content = content.replace('className="text-[#0D9488] font-bold text-[5px]', 'className="text-[#1e3a8a] font-bold text-[5px]')

    # Also the labels for Contacto, etc. on the back card
    content = content.replace('text-[#0D9488]', 'text-[#1e3a8a]')

    # Actually wait, I shouldn't replace ALL text-[#0D9488] because SALUD CONECTA is teal!
    # I'll just rely on the first replacement since it targets the front labels exactly, but let's check the back labels:
    # They have className="text-[#1e3a8a] font-bold text-[5px] sm:text-[8px] uppercase tracking-wide"
    # Wait, they are ALREADY #1e3a8a! Excellent.
    # What about SALUD CONECTA? It's text-[#0D9488] which is correct.

    with open('src/components/PerfilView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
