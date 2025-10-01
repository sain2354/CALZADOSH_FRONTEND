import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, // Se importa la función para crear usuarios
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  authState,
} from '@angular/fire/auth';
import { Observable, from, of, switchMap, take } from 'rxjs';
import { map } from 'rxjs/operators';

// Modelo para la respuesta de tu backend
export interface UserBackendResponse {
  idUsuario: number;
  username: string;
  nombreCompleto: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthTiendaService {
  private auth: Auth = inject(Auth);
  private http: HttpClient = inject(HttpClient);

  private readonly backendSyncUrl = 'https://www.chbackend.somee.com/api/usuarios/sync';

  public readonly user$: Observable<User | null> = authState(this.auth);

  constructor() {
    console.log('AuthTiendaService inicializado');
  }

  // --- INICIO DE LA MODIFICACIÓN: SE AÑADE LA FUNCIÓN DE REGISTRO ---

  /**
   * Registra un nuevo usuario con email y contraseña.
   * @param email Email para el nuevo usuario.
   * @param password Contraseña para el nuevo usuario.
   * @param displayName Nombre a mostrar para el nuevo usuario.
   * @returns Una promesa que resuelve con la respuesta del backend tras la sincronización.
   */
  async signUpWithEmail(email: string, password: string, displayName: string): Promise<UserBackendResponse> {
    // 1. Crear el usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Sincronizar el nuevo usuario con el backend propio. Se reutiliza la misma
    //    lógica que para el login para asegurar la consistencia de los datos.
    return this.syncUserWithBackend(
      firebaseUser,
      password, // Se envía la contraseña para el registro en el backend
      displayName
    );
  }

  // --- FIN DE LA MODIFICACIÓN ---

  /**
   * Inicia sesión con correo y contraseña.
   */
  async signInWithEmail(email: string, password: string): Promise<UserBackendResponse> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    const firebaseUser = userCredential.user;
    return this.syncUserWithBackend(
      firebaseUser,
      password,
      firebaseUser.displayName
    );
  }

  /**
   * Inicia sesión con el popup de Google.
   */
  async signInWithGoogle(): Promise<UserBackendResponse> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(this.auth, provider);
    const firebaseUser = userCredential.user;
    return this.syncUserWithBackend(
      firebaseUser,
      'googlePass123',
      firebaseUser.displayName
    );
  }

  /**
   * Cierra la sesión del usuario actual.
   */
  async signOut(): Promise<void> {
    return signOut(this.auth);
  }

  /**
   * Llama al backend para crear/actualizar el usuario y obtener su ID.
   */
  private syncUserWithBackend(
    firebaseUser: User,
    password?: string,
    displayName?: string | null,
    phone?: string | null
  ): Promise<UserBackendResponse> {
    const usedName = displayName?.trim() || (firebaseUser.email?.split('@')[0] ?? 'Usuario');
    const usedPhone = phone?.trim() || 'No registrado';
    const normalizedEmail = (firebaseUser.email ?? '').trim().toLowerCase();

    const body = {
      username: normalizedEmail,
      password: password,
      nombreCompleto: usedName,
      email: normalizedEmail,
      telefono: usedPhone,
    };

    console.log('Sincronizando usuario con el backend:', body);

    return this.http.post<UserBackendResponse>(this.backendSyncUrl, body).pipe(take(1)).toPromise()
      .then(response => {
        if (!response) {
          throw new Error('La respuesta del backend fue vacía.');
        }
        console.log('Usuario sincronizado con éxito. ID de backend:', response.idUsuario);
        return response;
      })
      .catch(error => {
        console.error('Error al sincronizar usuario en backend:', error);
        throw error;
      });
  }
}
