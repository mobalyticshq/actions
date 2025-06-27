import * as slugify_ from "slugify";

export const initSlugify =()=>

    slugify_.default.extend({
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

export function slugify(value:string){
    return slugify_.default(value,
    {
    replacement: '-',  // replace spaces with replacement character, defaults to `-`
    remove: undefined, // remove characters that match regex, defaults to `undefined`
    lower: true,      // convert to lower case, defaults to `false`
    strict: false,     // strip special characters except replacement, defaults to `false`
    locale: 'vi',      // language code of the locale to use
    trim: true         // trim leading and trailing replacement chars, defaults to `true`
    }        
    );
}
export function isImage(val:string,prefix:string="https://"){            
    if(!val|| val==='') return false;
    return val.startsWith(prefix) && 
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

export function tryParse(value:string){
    try{
        return JSON.parse(value);
    }catch{

    }
    return value;
}

export async function sendSlack(slackMessage:string,iconEmoji = ':receipt:') {    
    const channel = '#notifications-static-data-upload';
    const username = 'Static data service';    

    const payload = {
        text: slackMessage,
        channel: channel,
        username: username,
        as_user: 'true',
        link_names: 'true',
        icon_emoji: iconEmoji,
    };

    const body = new URLSearchParams({ payload: JSON.stringify(payload) });

    const response = await fetch(`https://hooks.slack.com/services/${process.env.SLACK_BOT_TOKEN}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Slack API error:', errorText);
    } 

}