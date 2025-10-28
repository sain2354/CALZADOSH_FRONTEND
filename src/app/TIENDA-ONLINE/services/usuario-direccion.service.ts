import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interface for the request body when creating/updating a user address
export interface UsuarioDireccionRequest {
  idUsuario: number;
  alias: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia?: string;
}

// Interface for the response when an address is created
export interface UsuarioDireccionResponse {
  idDireccion: number;
  idUsuario: number;
  alias: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia?: string;
  fechaRegistro: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioDireccionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/UsuarioDireccion`;

  constructor() { }

  // Method to create a new address for a user
  crearDireccion(data: UsuarioDireccionRequest): Observable<UsuarioDireccionResponse> {
    return this.http.post<UsuarioDireccionResponse>(this.apiUrl, data);
  }

  // Method to get all addresses for a user
  obtenerDireccionesPorUsuario(idUsuario: number): Observable<UsuarioDireccionResponse[]> {
    return this.http.get<UsuarioDireccionResponse[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }
}
