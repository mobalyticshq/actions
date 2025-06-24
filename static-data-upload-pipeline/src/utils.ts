export function slugify(str:string) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
  str = str.toLowerCase(); // convert string to lowercase
  str = str.replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
           .replace(/\s+/g, '-') // replace spaces with hyphens
           .replace(/-+/g, '-'); // remove consecutive hyphens
  return str;
}


export function isImage(val:string){            
    if(!val|| val==='') return false;
    return val.startsWith("https://cdn.mobalytics.gg") && (val.endsWith('.avif')||val.endsWith('.png')||val.endsWith('.webp'));
}

export function stringify(value:any){
    if(value  instanceof Object){
        return JSON.stringify(value)
    }
    return String(value);
}
