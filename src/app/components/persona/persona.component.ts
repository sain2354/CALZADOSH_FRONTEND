// src/app/components/persona/persona.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona } from '../../models/persona.model';
import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './persona.component.html',
  styleUrls: ['./persona.component.css']
})
export class PersonaComponent {
  // Recibimos la persona a editar o una nueva
  @Input() persona: Persona = {
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    tipoPersona: 'Cliente',
    tipoDocumento: 'NDI',
    numeroDocumento: ''
  };

  // Para saber si es edición o nuevo
  @Input() esEdicion: boolean = false;

  // Emitimos un evento al guardar (o actualizar)
  @Output() onGuardar = new EventEmitter<Persona>();
  // Para cerrar el modal
  @Output() onCancelar = new EventEmitter<void>();

  constructor(private personaService: PersonaService) {}

  guardar() {
    // Si tiene idPersona, actualizamos; si no, creamos
    if (this.persona.idPersona) {
      // Update
      this.personaService.updatePersona(this.persona.idPersona, this.persona).subscribe({
        next: (resp) => {
          alert('¡Persona actualizada con éxito!');
          this.onGuardar.emit(resp);
        },
        error: (err) => {
          console.error('Error al actualizar persona:', err);
          alert('Ocurrió un error al actualizar la persona.');
        }
      });
    } else {
      // Create
      this.personaService.createPersona(this.persona).subscribe({
        next: (resp) => {
          alert('¡Persona registrada con éxito!');
          this.onGuardar.emit(resp);
        },
        error: (err) => {
          console.error('Error al crear persona:', err);
          alert('Ocurrió un error al crear la persona.');
        }
      });
    }
  }

  cancelar() {
    this.onCancelar.emit();
  }
}
