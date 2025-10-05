//rock, diamond, cheese, gold, iron, osmium, wood
const materials = new Map([
    ["osmium",22610],["rock",3000],["diamond",3520],
    ["cheese",700],["gold",19320],["iron",7874],["wood",1000]]);

function getDensity(material){
    return materials.get(material);
}

function meteorEnergy(material, diameter, velocity){
    let density;
    density = getDensity(material);
    return (Math.PI/12)*density*((diameter/1000)**3)*((velocity*1000)**2);
}

export function mass(material, diameter){
    let density;
    density = getDensity(material);
    return density*(4/3)*Math.PI*((diameter/500)**3);
}

export function craterRadius(material, diameter, velocity){
    return 0.18*(meteorEnergy(material, diameter, velocity)/(3000*9.8))**0.25;
}

export function craterDepth(material, diameter, velocity){
    return 0.0278*(craterRadius(material, diameter, velocity));
}

export function lethalDistance(material, diameter, velocity){
    let density;
    density = getDensity(material);
    return 0.388*((density**(1/3))*(diameter/1000)*((velocity)**(2/3)));
}

console.log(mass("iron",2500));