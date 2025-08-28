// src/app/models/usuario-web-request.model.ts
// Matches UsuarioWebRequest DTO in backend
export interface UsuarioWebRequest {
    username: string;
    nombreCompleto: string;
    email: string;
    telefono?: string; // Optional field
    password?: string; // Optional field (only required for creation or if changing)
    idRol?: number; // Optional field (required for creation)
    // TODO: If your backend PUT endpoint for state needs an 'estado' field, add it here
    // estado?: string; // Example if needed
     fechaRegistro?: Date; // Optional, may be set by backend
     idUsuario?: number; // Optional, for updates
}
