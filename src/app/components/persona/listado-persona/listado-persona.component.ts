// src/app/components/persona/listado-persona/listado-persona.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Persona } from '../../../models/persona.model';
import { PersonaService } from '../../../services/persona.service';
import { PersonaComponent } from '../persona.component'; // Form modal
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
  personaSeleccionada: Persona | null = null;  // Para editar
  mostrarModal: boolean = false;               // Control del modal
  esEdicion: boolean = false;                  // Control para nuevo/editar

  // Paginación
  p: number = 1;          // Página actual
  pageSize: number = 10;  // Tamaño de página por defecto

  // Búsqueda local
  searchTerm: string = '';

  constructor(private personaService: PersonaService) {}

  ngOnInit(): void {
    this.cargarPersonas();
  }

  cargarPersonas() {
    this.personaService.getAllPersonas().subscribe({
      next: (data) => {
        this.personas = data;
      },
      error: (err) => {
        console.error('Error al cargar personas', err);
      }
    });
  }

  // Getter para filtrar la lista de personas según searchTerm
  get personasFiltradas(): Persona[] {
    if (!this.searchTerm) {
      return this.personas;
    }
    const term = this.searchTerm.toLowerCase();
    return this.personas.filter(persona =>
      persona.tipoPersona?.toLowerCase().includes(term) ||
      persona.numeroDocumento?.toLowerCase().includes(term) ||
      persona.nombre?.toLowerCase().includes(term) ||
      persona.direccion?.toLowerCase().includes(term) ||
      persona.telefono?.toLowerCase().includes(term) ||
      persona.correo?.toLowerCase().includes(term)
    );
  }

  // Cálculo para mostrar "Mostrando X a Y de Z registros"
  get startIndex(): number {
    return (this.p - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const calc = this.p * this.pageSize;
    return calc > this.personasFiltradas.length
      ? this.personasFiltradas.length
      : calc;
  }

  // Abre el modal para crear nueva persona
  nuevo() {
    this.personaSeleccionada = {
      nombre: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipoPersona: 'Cliente',
      tipoDocumento: 'NDI',
      numeroDocumento: ''
    };
    this.esEdicion = false;
    this.mostrarModal = true;
  }

  // Abre el modal para editar
  editar(persona: Persona) {
    // Clonamos el objeto para no alterar la tabla mientras editamos
    this.personaSeleccionada = { ...persona };
    this.esEdicion = true;
    this.mostrarModal = true;
  }

  // Se llama cuando el componente hijo (PersonaComponent) emite onGuardar
  onGuardarPersona(personaGuardada: Persona) {
    // Cerrar el modal
    this.mostrarModal = false;

    // Si es edición, reemplazamos en la lista
    if (this.esEdicion) {
      const index = this.personas.findIndex(p => p.idPersona === personaGuardada.idPersona);
      if (index !== -1) {
        this.personas[index] = personaGuardada;
      }
    } else {
      // Es nuevo, lo agregamos a la lista
      this.personas.push(personaGuardada);
    }
  }

  // Se llama cuando el componente hijo emite onCancelar
  onCancelarPersona() {
    this.mostrarModal = false;
  }

  eliminar(persona: Persona) {
    if (!persona.idPersona) return;
    if (confirm('¿Estás seguro de eliminar esta persona?')) {
      this.personaService.deletePersona(persona.idPersona).subscribe({
        next: () => {
          alert('Persona eliminada con éxito.');
          this.personas = this.personas.filter(p => p.idPersona !== persona.idPersona);
        },
        error: (err) => {
          console.error('Error al eliminar persona:', err);
          alert('Ocurrió un error al eliminar la persona.');
        }
      });
    }
  }
}
