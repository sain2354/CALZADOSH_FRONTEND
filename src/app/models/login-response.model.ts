// src/app/models/login-response.model.ts
// Matches the LoginResponse DTO in your backend

export interface LoginResponse {
    idUsuario: number;
    username: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
    nombreRol?: string; // This property is now expected in the login response
    // Add other properties if your backend includes them (e.g., token)
    // token?: string;
}
