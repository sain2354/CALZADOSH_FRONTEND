import { Injectable, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification, // <--- 1. IMPORTADO
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  authState,
  deleteUser,
} from '@angular/fire/auth';
import { Observable, from, of, BehaviorSubject, throwError } from 'rxjs';
import { map, switchMap, take, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserBackendResponse {
  idUsuario: number;
  username: string;
  nombres: string; 
  apellidos: string;
  email: string;
  telefono: string;
  nombreRol?: string;
  numero_documento?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthTiendaService {
  private auth: Auth = inject(Auth);
  private http: HttpClient = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private readonly backendLoginUrl = `${environment.apiUrl}/usuarios/login`;
  private readonly backendRegisterUrl = `${environment.apiUrl}/usuarios/register`;
  private readonly googleLoginUrl = `${environment.apiUrl}/usuarios/googleLogin`;

  public readonly firebaseUser$: Observable<User | null> = authState(this.auth);

  
  private currentUserSubject: BehaviorSubject<UserBackendResponse | null>;
  public readonly currentUser$: Observable<UserBackendResponse | null>;

  constructor() {
    let initialUser = null;
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        initialUser = JSON.parse(storedUser);
      }
    }
    this.currentUserSubject = new BehaviorSubject<UserBackendResponse | null>(initialUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserId(): number | null {
      return this.currentUserSubject.value?.idUsuario ?? null;
  }

  async signUpWithEmail(email: string, password: string, displayName: string, dni: string, telefono: string): Promise<UserBackendResponse> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const firebaseUser = userCredential.user;

    await sendEmailVerification(firebaseUser); // <--- 2. SE ENVÍA EL CORREO DE VERIFICACIÓN

    const [firstName, ...lastNameParts] = displayName.split(' ');
    const lastName = lastNameParts.join(' ');

    const requestBody = {
      email: firebaseUser.email || email,
      password: password,
      username: email,
      Nombres: firstName,
      Apellidos: lastName || firstName,
      NumeroDocumento: dni,
      Telefono: telefono
    };

    return from(this.http.post<UserBackendResponse>(this.backendRegisterUrl, requestBody)).pipe(
      tap(backendUser => {
        this.storeUser(backendUser);
      }),
      catchError(async (error) => {
        if (firebaseUser) {
          try {
            await deleteUser(firebaseUser);
            console.warn('Usuario de Firebase eliminado debido a un fallo en el registro del backend.');
          } catch (deleteError) {
            console.error('Error al intentar eliminar el usuario de Firebase después de un registro fallido:', deleteError);
          }
        }
        return throwError(() => new Error('El registro en el backend falló después de la creación en Firebase.'));
      }),
      take(1)
    ).toPromise() as Promise<UserBackendResponse>;
  }

  async signInWithEmail(email: string, password: string): Promise<UserBackendResponse> {
    await signInWithEmailAndPassword(this.auth, email, password);
    const backendUser = await this.http.post<{usuario: UserBackendResponse}>(this.backendLoginUrl, { usernameOrEmail: email, password })
        .pipe(map(response => response.usuario), take(1)).toPromise();
        
    if (!backendUser) {
        throw new Error('Failed to get user profile from backend.');
    }
    this.storeUser(backendUser);
    return backendUser;
  }

  async signInWithGoogle(): Promise<UserBackendResponse> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(this.auth, provider);
    const firebaseUser = userCredential.user;

    const requestBody = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName,
        phone: firebaseUser.phoneNumber
    };
    
    const backendUser = await this.http.post<{usuario: UserBackendResponse}>(this.googleLoginUrl, requestBody)
        .pipe(map(response => response.usuario), take(1)).toPromise();

    if (!backendUser) {
        throw new Error('Failed to get user profile from backend via Google.');
    }

    this.storeUser(backendUser);
    return backendUser;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  updateUserProfile(userId: number, profileData: { nombres: string, apellidos: string, numero_documento: string, telefono:string }): Observable<any> {
    const requestBody = {
        nombres: profileData.nombres,
        apellidos: profileData.apellidos,
        numero_documento: profileData.numero_documento,
        telefono: profileData.telefono
    };
    return this.http.put(`${environment.apiUrl}/usuarios/${userId}`, requestBody);
  }

  private storeUser(user: UserBackendResponse) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }
}
