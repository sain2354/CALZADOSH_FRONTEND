// src/app/models/usuario-request.model.ts

// Matches the UsuarioRequest DTO in your backend
export interface UsuarioRequest {
    username: string;
    password?: string; // Optional in backend request for updates
    nombreCompleto: string;
    email: string;
    telefono?: string; // Optional in backend request
    idRol?: number; // Optional in backend request (used for web user creation/update)
}
