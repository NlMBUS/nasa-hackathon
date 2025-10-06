const materials = new Map([
    ["osmium",22610],["rock",3000],["diamond",3520],
    ["gold",19320],["iron",7874],["wood",1000]]);

function getDensity(material: string){
    return materials.get(material);
}

function meteorEnergy(material: string, diameter: number, velocity: number){
    let density;
    density = getDensity(material) ?? 0;
    return (Math.PI/12)*density*((diameter/1000)**3)*((velocity*1000)**2);
}

export function mass(material: string, diameter: number){
    let density;
    density = getDensity(material) ?? 0;
    return density*(4/3)*Math.PI*((diameter/500)**3);
}

export function craterRadius(material: string, diameter: number, velocity: number){
    return 0.18*(meteorEnergy(material, diameter, velocity)/(3000*9.8))**0.25;
}

export function craterDepth(material: string, diameter: number, velocity: number){
    return 0.0278*(craterRadius(material, diameter, velocity));
}

export function lethalDistance(material: string, diameter: number, velocity: number){
    let density;
    density = getDensity(material) ?? 0;
    return 0.388*((density**(1/3))*(diameter/1000)*((velocity)**(2/3)));
}