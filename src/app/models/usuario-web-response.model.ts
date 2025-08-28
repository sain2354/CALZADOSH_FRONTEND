// src/app/models/usuario-web-response.model.ts
// Matches UsuarioWebResponse DTO in backend
export interface UsuarioWebResponse {
    idUsuario: number;
    username: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
    fechaRegistro: Date;
    idRol: number; // Rol ID
    nombreRol: string; // Rol Name
    // TODO: If your backend includes 'Estado' in the response, add it here
    estado?: string; // Example if included in the response
}
