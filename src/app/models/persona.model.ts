// src/app/models/persona.model.ts
export interface Persona {
  idPersona?: number;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  fechaRegistro?: string;  // JSON como "2025-06-05T..."
  tipoPersona: 'Cliente' | 'Proveedor';    // Valores específicos
  tipoDocumento: 'DNI' | 'RUC';  // Valores específicos
  numeroDocumento?: string;
}