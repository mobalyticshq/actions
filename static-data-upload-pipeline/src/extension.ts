import { StaticData, ValidationReport } from "./types";




export = async function (data:StaticData,oldData:StaticData): Promise<ValidationReport>{

  return {
    errors:{
       
    },
    warnings:{

    },  
    info:{

    },                     
    byGroup:{

    }
  }
};