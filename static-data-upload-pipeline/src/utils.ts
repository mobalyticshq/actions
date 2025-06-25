import slugify from "slugify";

export const initSlugify =()=> 
    slugify.extend({
    "+": "-plus",
    "-": "-",
    "*": "-",
    "/": "-",
    "%": "-",
    "&": "-",
    "|": "-",
    "^": "-",
    "~": "-",
    "!": "-",
    "@": "-",
    "#": "-",
    $: "-",
    "(": "-",
    ")": "-",
    "[": "-",
    "]": "-",
    "{": "-",
    "}": "-",
    "<": "-",
    ">": "-",
    "=": "-",
    "?": "-",
    ":": "-",
    ";": "-",
    ",": "-",
    ".": "-",
    '"': "-",
    "'": "-",
    "\\": "-",
    " ": "-",
    });

export function isImage(val:string){            
    if(!val|| val==='') return false;
    return val.startsWith("https://cdn.mobalytics.gg") && 
    (val.endsWith('.avif')||
    val.endsWith('.svg')||
    val.endsWith('.gif')||
    val.endsWith('.png')||
    val.endsWith('.jpg')||
    val.endsWith('.jpeg')||
    val.endsWith('.webp')
);
}

export function stringify(value:any){
    if(value  instanceof Object){
        return JSON.stringify(value)
    }
    return String(value);
}
