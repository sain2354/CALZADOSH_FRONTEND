// src/app/components/persona/persona.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonaService } from '../../services/persona.service';
import { Persona } from '../../models/persona.model';

@Component({
  selector: 'app-persona',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './persona.component.html',
  styleUrls: ['./persona.component.css']
})
export class PersonaComponent {

  @Output() close = new EventEmitter<void>();
  @Output() personaCreada = new EventEmitter<Persona>();

  nuevo: Persona = {
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    tipoPersona: 'Cliente',
    tipoDocumento: 'NDI',
    numeroDocumento: ''
  };

  constructor(private personaService: PersonaService) {}

  guardarPersona() {
    this.personaService.createPersona(this.nuevo).subscribe({
      next: (resp) => {
        console.log('Persona creada:', resp);
        alert('¡Persona registrada con éxito!');
        // Emitimos personaCreada para que el padre actualice la lista de clientes
        this.personaCreada.emit(resp);
        // Cerramos el modal
        this.close.emit();
      },
      error: (err) => {
        console.error('Error al crear persona:', err);
        alert('Ocurrió un error al crear la persona.');
      }
    });
  }

  cancelar() {
    // Simplemente cerramos el modal
    this.close.emit();
  }
}
