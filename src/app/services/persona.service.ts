// src/app/services/persona.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Persona } from '../models/persona.model';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private apiUrl = 'https://localhost:5001/api/Persona'; // Ajusta a tu backend

  constructor(private http: HttpClient) {}

  getAllPersonas(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.apiUrl);
  }

  createPersona(persona: Persona): Observable<Persona> {
    return this.http.post<Persona>(this.apiUrl, persona);
  }

  updatePersona(idPersona: number, persona: Persona): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiUrl}/${idPersona}`, persona);
  }

  deletePersona(idPersona: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idPersona}`);
  }
}
