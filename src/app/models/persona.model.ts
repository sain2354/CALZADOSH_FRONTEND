// src/app/models/persona.model.ts
export interface Persona {
    idPersona?: number;
    nombre: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    fechaRegistro?: string; 
    tipoPersona?: string;       // "Cliente", "Proveedor", etc.
    tipoDocumento?: string;     // "NDI", "RUC", etc.
    numeroDocumento?: string;
  }
  