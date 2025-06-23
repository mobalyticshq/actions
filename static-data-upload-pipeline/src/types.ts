export type Entity = {
  id:string;
  slug?:string;
  gameId?:string;
  deprecated?:boolean;
  [key:string]:any;
}

export type StaticData = { [key: string]: Array<Entity> };
