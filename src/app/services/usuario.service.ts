// src/app/services/usuario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UsuarioWebResponse } from '../models/usuario-web-response.model';
import { UsuarioWebRequest } from '../models/usuario-web-request.model';
import { UsuarioResponse } from '../models/usuario-response.model'; // Import if needed for original endpoints
import { UsuarioRequest } from '../models/usuario-request.model'; // Import if needed for original endpoints
import { LoginResponse } from '../models/login-response.model'; // Import LoginResponse

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'https://www.chbackend.somee.com/api/usuarios';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de usuarios web con información de rol.
   * Llama a GET /api/usuarios/web.
   */
  obtenerUsuariosWeb(): Observable<UsuarioWebResponse[]> {
    return this.http.get<UsuarioWebResponse[]>(`${this.apiUrl}/web`).pipe(
      catchError(this.handleError)
    );
  }

   /**
    * Obtiene los detalles de un usuario web por su ID.
    * Llama a GET /api/usuarios/web/{id}.
    */
   obtenerUsuarioWebPorId(id: number): Observable<UsuarioWebResponse> {
       return this.http.get<UsuarioWebResponse>(`${this.apiUrl}/web/${id}`).pipe(
           catchError(this.handleError)
       );
   }


  /**
   * Crea un nuevo usuario web con un rol asignado.
   * Llama a POST /api/usuarios/web.
   * @param usuarioData Los datos del nuevo usuario.
   */
  crearUsuarioWeb(usuarioData: UsuarioWebRequest): Observable<UsuarioWebResponse> {
    return this.http.post<UsuarioWebResponse>(`${this.apiUrl}/web`, usuarioData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un usuario web existente (incluyendo datos y rol).
   * Llama a PUT /api/usuarios/web/{id}.
   * @param id El ID del usuario a actualizar.
   * @param usuarioData Los datos actualizados del usuario.
   */
  actualizarUsuarioWeb(id: number, usuarioData: UsuarioWebRequest): Observable<UsuarioWebResponse> {
    return this.http.put<UsuarioWebResponse>(`${this.apiUrl}/web/${id}`, usuarioData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un usuario por su ID.
   * Llama a DELETE /api/usuarios/{id}.
   * @param id El ID del usuario a eliminar.
   */
  eliminarUsuario(id: number): Observable<void> { // Assuming the backend returns 204 No Content
      return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
          catchError(this.handleError)
      );
  }

  /**
   * Envía credenciales para iniciar sesión.
   * Llama a POST /api/usuarios/login.
   * @param credentials Objeto con usernameOrEmail y password.
   * @returns Observable con la respuesta del login (incluye mensaje y objeto usuario con rol).
   */
  // Specify the expected response structure including the 'usuario' object with LoginResponse type
  login(credentials: { usernameOrEmail: string, password: string }): Observable<{ mensaje: string, usuario: LoginResponse }> {
      return this.http.post<{ mensaje: string, usuario: LoginResponse }>(`${this.apiUrl}/login`, credentials).pipe(
          catchError(this.handleError) // Reuse the existing error handler
      );
  }


  // TODO: Add methods for standard user endpoints if needed by the mobile app frontend
  // obtenerUsuarios(): Observable<UsuarioResponse[]> { ... } // If needed
  // obtenerUsuarioPorId(id: number): Observable<UsuarioResponse> { ... } // If needed
  // crearUsuario(usuarioData: UsuarioRequest): Observable<UsuarioResponse> { ... } // If needed
  // actualizarUsuario(id: number, usuarioData: UsuarioRequest): Observable<UsuarioResponse> { ... } // If needed
  // googleLogin(googleData: any): Observable<any> { ... } // If needed
  // syncUsuario(userData: any): Observable<any> { ... } // If needed


  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`); // CORRECTED LINE: Use JSON.stringify(error.error)

        // Return a specific error message from the backend if available
        if (error.error && typeof error.error === 'object' && error.error.mensaje) {
             // If the error body is an object with a 'mensaje' property, propagate it
             return throwError(() => new Error(error.error.mensaje));
         } else if (error.error && typeof error.error === 'string') {
             // If the error body is a string, propagate that string
             return throwError(() => new Error(error.error));
         } else if (error.status === 401) {
             // Handle Unauthorized specifically if needed
              return throwError(() => new Error('Credenciales inválidas.'));
         }
    }
    // Propagate a generic error message if no specific one is available
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
