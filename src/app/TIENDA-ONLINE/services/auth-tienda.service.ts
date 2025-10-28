import { Injectable, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  authState,
} from '@angular/fire/auth';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserBackendResponse {
  idUsuario: number;
  username: string;
  nombres: string; // Changed from nombreCompleto to match backend response
  apellidos: string;
  email: string;
  telefono: string;
  nombreRol?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthTiendaService {
  private auth: Auth = inject(Auth);
  private http: HttpClient = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private readonly backendLoginUrl = `${environment.apiUrl}/usuarios/login`;
  private readonly googleLoginUrl = `${environment.apiUrl}/usuarios/googleLogin`;

  public readonly firebaseUser$: Observable<User | null> = authState(this.auth);

  // BehaviorSubject to hold the backend user profile
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

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<UserBackendResponse> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const [firstName, ...lastNameParts] = displayName.split(' ');
    const lastName = lastNameParts.join(' ');

    const requestBody = {
      email: userCredential.user.email || email,
      password: password,
      nombres: firstName,
      apellidos: lastName || firstName,
      username: email, // Assuming username is the email for new sign-ups
    };

    // This should ideally call a /register endpoint, but we use login and assume it syncs
    return this.http.post<UserBackendResponse>(this.backendLoginUrl, { usernameOrEmail: email, password })
      .pipe(
        tap(backendUser => {
          this.storeUser(backendUser);
        }),
        take(1)
      ).toPromise() as Promise<UserBackendResponse>;
  }

  async signInWithEmail(email: string, password: string): Promise<UserBackendResponse> {
    await signInWithEmailAndPassword(this.auth, email, password);
    // After Firebase login, call our backend's login to get profile data
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

  private storeUser(user: UserBackendResponse) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }
}
