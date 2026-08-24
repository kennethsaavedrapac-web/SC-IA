import sys

def main():
    with open('src/components/PerfilView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    old_grid = """                      <div className="grid grid-cols-2 gap-y-1.5 sm:gap-y-4 gap-x-2">
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">FECHA DE NACIMIENTO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg">
                            {user.birthDate ? user.birthDate.split('-').reverse().join('/') : '---'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">LUGAR DE NACIMIENTO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg uppercase">{user.city || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">SEXO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg uppercase">{user.sex === 'male' ? 'MASCULINO' : user.sex === 'female' ? 'FEMENINO' : 'NO ESP.'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">NÚMERO DE IDENTIDAD</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg">{localMedicalData.cedula || '---'}</p>
                        </div>
                      </div>"""

    new_grid = """                      <div className="grid grid-cols-2 gap-y-1.5 sm:gap-y-4 gap-x-2">
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">FECHA DE NACIMIENTO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg">
                            {user.birthDate ? user.birthDate.split('-').reverse().join('/') : '---'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">LUGAR DE NACIMIENTO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg uppercase">{user.city || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">SEXO</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg uppercase">{user.sex === 'male' ? 'MASCULINO' : user.sex === 'female' ? 'FEMENINO' : 'NO ESP.'}</p>
                        </div>
                        <div>
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">NÚMERO DE IDENTIDAD</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg">{localMedicalData.cedula || '---'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[#1e3a8a] font-bold text-[6px] sm:text-xs">PAÍS DE RESIDENCIA</p>
                          <p className="text-slate-800 font-bold text-[8px] sm:text-lg uppercase">{user.country || '---'}</p>
                        </div>
                      </div>"""

    if old_grid not in content:
        print("Could not find the target string to replace.")
        sys.exit(1)

    content = content.replace(old_grid, new_grid)
    
    with open('src/components/PerfilView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Success")

if __name__ == '__main__':
    main()
