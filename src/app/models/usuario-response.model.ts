// src/app/models/usuario-response.model.ts

// Matches the UsuarioResponse DTO in your backend
export interface UsuarioResponse {
    idUsuario: number;
    username: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
    fechaRegistro: Date;
    // Although the backend UsuarioResponse *could* include NombreRol now,
    // this DTO is primarily for the original endpoints that might not return it.
    // For web users with roles, we use UsuarioWebResponse.
    nombreRol?: string; // Keep it optional here if original endpoints don't always return it
}
