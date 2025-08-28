// src/app/models/rol.model.ts
// Matches RolResponse DTO in backend
export interface Rol {
    idRol: number;
    nombre: string;
    descripcion?: string; // Optional field
}
