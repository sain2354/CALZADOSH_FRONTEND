import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona } from '../../../models/persona.model';
import { PersonaService } from '../../../services/persona.service';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './persona.component.html',
  styleUrls: ['./persona.component.css']
})
export class PersonaComponent {
  @Input() persona: Persona = {
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    tipoPersona: 'Cliente',
    tipoDocumento: 'DNI',
    numeroDocumento: ''
  };

  @Input() esEdicion: boolean = false;

  @Output() onGuardar = new EventEmitter<Persona>();
  @Output() onCancelar = new EventEmitter<void>();

  // Para manejar el overlay de mensajes (éxito/error)
  muestraOverlay: boolean = false;
  mensajeOverlay: string = '';
  esError: boolean = false;

  private _personaParaEmitir: Persona | null = null;

  constructor(private personaService: PersonaService) {}

  guardar() {
    // Validamos Nombre
    if (!this.persona.nombre.trim()) {
      this.mostrarMensajeError('El campo "Nombres" es obligatorio.');
      return;
    }

    // Validamos Documento (DNI o RUC), comprobando que numeroDocumento no sea undefined
    const doc = this.persona.numeroDocumento ?? '';
    if (!doc.trim()) {
      // Si es proveedor, mostramos “RUC”; si es cliente, “DNI”
      const campo = this.persona.tipoPersona === 'Proveedor' ? 'RUC' : 'DNI';
      this.mostrarMensajeError(`El campo "${campo}" es obligatorio.`);
      return;
    }

    if (this.esEdicion && this.persona.idPersona) {
      // === ACTUALIZAR ===
      this.personaService.updatePersona(this.persona.idPersona, this.persona).subscribe({
        next: (personaActualizada) => {
          const tipo = this.persona.tipoPersona === 'Proveedor' ? 'Proveedor' : 'Cliente';
          this.mostrarMensajeExito(`${tipo} actualizado correctamente.`, personaActualizada);
        },
        error: (err) => {
          console.error('Error al actualizar persona:', err);
          this.mostrarMensajeError('Ha ocurrido un error al actualizar la persona.');
        }
      });
    } else {
      // === CREAR ===
      this.personaService.createPersona(this.persona).subscribe({
        next: (personaCreada) => {
          const tipo = this.persona.tipoPersona === 'Proveedor' ? 'Proveedor' : 'Cliente';
          this.mostrarMensajeExito(`${tipo} registrado correctamente.`, personaCreada);
        },
        error: (err) => {
          console.error('Error al crear persona:', err);
          this.mostrarMensajeError('Ha ocurrido un error al registrar la persona.');
        }
      });
    }
  }

  cancelar() {
    this.onCancelar.emit();
  }

  confirmarOverlay() {
    this.muestraOverlay = false;
    if (!this.esError && this._personaParaEmitir) {
      this.onGuardar.emit(this._personaParaEmitir);
      this._personaParaEmitir = null;
    }
    // Si fue error, simplemente cerramos el overlay sin emitir
  }

  private mostrarMensajeExito(texto: string, personaGuardada: Persona) {
    this.mensajeOverlay = texto;
    this.esError = false;
    this.muestraOverlay = true;
    this._personaParaEmitir = personaGuardada;
  }

  private mostrarMensajeError(texto: string) {
    this.mensajeOverlay = texto;
    this.esError = true;
    this.muestraOverlay = true;
  }
}
