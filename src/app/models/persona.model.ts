// src/app/models/persona.model.ts

export interface Persona {
  idPersona?: number;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  fechaRegistro?: string;  // JSON como “2025-06-05T...”
  tipoPersona?: string;    // “Cliente” o “Proveedor”
  tipoDocumento?: string;  // “DNI” o “RUC”
  numeroDocumento?: string;
}
