export type Entity = {
  id:string;
  slug?:string;
  gameId?:string;
  deprecated?:boolean;
  [key:string]:any;
}

export type StaticData = { [key: string]: Array<Entity> };


export type StaticDataConfig = {
    refs:Array<{from:string,to:string}>;
}

export type ValidationRecords = {
    [key: string]:Set<string>;//[errorText]:column    
};
export type ValidationEntityReport={
    entity:Entity;
    errors:ValidationRecords,
    infos:ValidationRecords,
    warnings:ValidationRecords   
}

export type ValidationReport ={
    errors:ValidationRecords,
    warnings:ValidationRecords,
    infos:ValidationRecords,
    byGroup:{ [key: string]:Array<ValidationEntityReport>};
};