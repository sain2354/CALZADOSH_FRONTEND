// src/app/components/persona/listado-persona/listado-persona.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Persona } from '../../../models/persona.model';
import { PersonaService } from '../../../services/persona.service';
import { PersonaComponent } from '../nuevo-persona/persona.component'; // Form modal
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-listado-persona',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, PersonaComponent],
  templateUrl: './listado-persona.component.html',
  styleUrls: ['./listado-persona.component.css']
})
export class ListadoPersonaComponent implements OnInit {
  personas: Persona[] = [];
  personaSeleccionada: Persona | null = null;
  mostrarModal: boolean = false;
  esEdicion: boolean = false;

  // Paginación
  p: number = 1;
  pageSize: number = 10;

  // Búsqueda local
  searchTerm: string = '';

  constructor(private personaService: PersonaService) {}

  ngOnInit(): void {
    this.cargarPersonas();
  }

  private cargarPersonas() {
    this.personaService.getAllPersonas().subscribe({
      next: data => {
        this.personas = data;
      },
      error: err => {
        console.error('Error al cargar personas', err);
      }
    });
  }

  // Filtrado local
  get personasFiltradas(): Persona[] {
    if (!this.searchTerm) {
      return this.personas;
    }
    const term = this.searchTerm.toLowerCase();
    return this.personas.filter(persona =>
      (persona.tipoPersona ?? '').toLowerCase().includes(term) ||
      (persona.numeroDocumento ?? '').toLowerCase().includes(term) ||
      (persona.nombre ?? '').toLowerCase().includes(term) ||
      (persona.direccion ?? '').toLowerCase().includes(term) ||
      (persona.telefono ?? '').toLowerCase().includes(term) ||
      (persona.correo ?? '').toLowerCase().includes(term)
    );
  }

  get startIndex(): number {
    return (this.p - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const calc = this.p * this.pageSize;
    return calc > this.personasFiltradas.length
      ? this.personasFiltradas.length
      : calc;
  }

  // Abrir modal para crear
  nuevo() {
    this.personaSeleccionada = {
      nombre: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipoPersona: 'Cliente',
      tipoDocumento: 'DNI',
      numeroDocumento: ''
    };
    this.esEdicion = false;
    this.mostrarModal = true;
  }

  // Abrir modal para editar
  editar(persona: Persona) {
    this.personaSeleccionada = { ...persona };
    this.esEdicion = true;
    this.mostrarModal = true;
  }

  // Se dispara cuando PersonaComponent emite onGuardar con un Persona
  onGuardarPersona(personaGuardada: Persona) {
    this.mostrarModal = false;
    if (this.esEdicion) {
      // Reemplazamos la persona en el arreglo
      const index = this.personas.findIndex(p => p.idPersona === personaGuardada.idPersona);
      if (index !== -1) {
        this.personas[index] = personaGuardada;
      }
    } else {
      // Nueva persona, la agregamos a la lista
      this.personas.push(personaGuardada);
    }
  }

  onCancelarPersona() {
    this.mostrarModal = false;
  }

  eliminar(persona: Persona) {
    if (!persona.idPersona) return;
    if (confirm('¿Estás seguro de eliminar esta persona?')) {
      this.personaService.deletePersona(persona.idPersona).subscribe({
        next: resp => {
          if (resp.success) {
            alert('Persona eliminada con éxito.');
            this.personas = this.personas.filter(p => p.idPersona !== persona.idPersona);
          } else {
            alert('No se pudo eliminar: ' + resp.message);
          }
        },
        error: err => {
          console.error('Error al eliminar persona:', err);
          alert('Ocurrió un error al eliminar la persona.');
        }
      });
    }
  }
}
