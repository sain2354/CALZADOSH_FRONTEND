// src/app/components/persona/nuevo-persona/persona.component.ts
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona } from '../../../models/persona.model';
import { PersonaService } from '../../../services/persona.service';
import { ApiPeruService } from '../../../services/api-peru.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './persona.component.html',
  styleUrls: ['./persona.component.css']
})
export class PersonaComponent implements OnInit {
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

  muestraOverlay: boolean = false;
  mensajeOverlay: string = '';
  esError: boolean = false;
  consultando: boolean = false;

  private _personaParaEmitir: Persona | null = null;

  constructor(
    private personaService: PersonaService,
    private apiPeruService: ApiPeruService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.esEdicion && this.persona.numeroDocumento) {
      if (this.persona.numeroDocumento.length === 8) {
        this.persona.tipoDocumento = 'DNI';
      } else if (this.persona.numeroDocumento.length === 11) {
        this.persona.tipoDocumento = 'RUC';
      }
    }
  }

  consultarDocumento() {
    if (!this.persona.numeroDocumento) {
      Swal.fire('Error', 'Por favor ingrese un número de documento', 'error');
      return;
    }

    this.consultando = true;

    if (this.persona.tipoPersona === 'Cliente' && this.persona.numeroDocumento.length === 8) {
      this.consultarDni();
    } else if (this.persona.tipoPersona === 'Proveedor' && this.persona.numeroDocumento.length === 11) {
      this.consultarRuc();
    } else {
      this.consultando = false;
      Swal.fire('Info', 'Para clientes ingrese 8 dígitos (DNI), para proveedores 11 dígitos (RUC)', 'info');
    }
  }

  consultarDni() {
    this.apiPeruService.consultarDni(this.persona.numeroDocumento!).subscribe({
      next: (datos: any) => {
        this.consultando = false;
        console.log('API DNI normalizado:', datos);
        this.applyAutofill(datos);
        Swal.fire('Éxito', 'Datos obtenidos correctamente', 'success');
      },
      error: (error) => {
        this.consultando = false;
        console.error('Error al consultar DNI (component):', error);
        Swal.fire('Error', error.message || 'Error al consultar el DNI', 'error');
      }
    });
  }

  consultarRuc() {
    this.apiPeruService.consultarRuc(this.persona.numeroDocumento!).subscribe({
      next: (datos: any) => {
        this.consultando = false;
        console.log('API RUC normalizado:', datos);
        this.applyAutofill(datos);
        Swal.fire('Éxito', 'Datos obtenidos correctamente', 'success');
      },
      error: (error) => {
        this.consultando = false;
        console.error('Error al consultar RUC (component):', error);
        Swal.fire('Error', error.message || 'Error al consultar el RUC', 'error');
      }
    });
  }

  private applyAutofill(datos: any) {
    console.log('autocompletarDatos -> raw:', datos);

    const get = (keys: string[]) => {
      for (const k of keys) {
        if (datos && datos[k] !== undefined && datos[k] !== null && `${datos[k]}`.trim() !== '') {
          return datos[k];
        }
      }
      return null;
    };

    if (this.persona.tipoPersona === 'Cliente') {
      const nombres = get(['nombre', 'nombres', 'nombres_completos', 'nombresCompletos']);
      const apellidoP = get(['apellidoPaterno', 'apellido_paterno']);
      const apellidoM = get(['apellidoMaterno', 'apellido_materno']);
      const direccion = get(['direccion', 'direccion_completa', 'direccionComplete']);
      const telefono = get(['telefono', 'celular', 'telf']);
      const email = get(['email', 'correo', 'mail']);

      if (nombres && `${nombres}`.trim() !== '') {
        this.persona.nombre = `${nombres}`.trim();
      } else {
        const built = `${apellidoP ?? ''} ${apellidoM ?? ''} ${nombres ?? ''}`.trim();
        this.persona.nombre = built || this.persona.nombre;
      }

      this.persona.direccion = (direccion ?? this.persona.direccion) ?? '';
      this.persona.telefono = (telefono ?? this.persona.telefono) ?? '';
      this.persona.correo = (email ?? this.persona.correo) ?? '';
    } else {
      const razonSocial = get(['razonSocial', 'razon_social', 'nombre']);
      const direccion = get(['direccion', 'direccion_completa', 'domicilio_fiscal']);
      const telefono = get(['telefono', 'telf', 'celular']);
      const email = get(['email', 'correo', 'mail']);

      this.persona.nombre = (razonSocial ?? this.persona.nombre) ?? '';
      this.persona.direccion = (direccion ?? this.persona.direccion) ?? '';
      this.persona.telefono = (telefono ?? this.persona.telefono) ?? '';
      this.persona.correo = (email ?? this.persona.correo) ?? '';
    }

    // Forzar binding
    this.persona = { ...this.persona };
    try { this.cd.detectChanges(); } catch (e) {}
    console.log('persona after autocompletar:', this.persona);
  }

  onTipoPersonaChange() {
    if (this.persona.tipoPersona === 'Cliente') {
      this.persona.tipoDocumento = 'DNI';
    } else {
      this.persona.tipoDocumento = 'RUC';
    }
    this.persona.numeroDocumento = '';
  }

  // --- Nuevo helper: normaliza antes de enviar al backend ---
  private normalizeForSave(persona: Persona): any {
    // Trim y convertir cadenas vacías a null para que los validadores del backend no fallen.
    const safeString = (v?: string) => {
      if (v === undefined || v === null) return null;
      const t = `${v}`.trim();
      return t === '' ? null : t;
    };

    // Construimos el payload exacto que enviaremos al backend
    const payload: any = {
      nombre: safeString(persona.nombre) ?? '',
      telefono: safeString(persona.telefono),
      correo: safeString(persona.correo),
      direccion: safeString(persona.direccion),
      fechaRegistro: persona.fechaRegistro ?? undefined, // backend usa default si no viene
      tipoPersona: safeString(persona.tipoPersona) ?? undefined,
      tipoDocumento: safeString(persona.tipoDocumento) ?? undefined,
      numeroDocumento: safeString(persona.numeroDocumento) ?? undefined
    };

    // No incluir propiedades undefined (opcional)
    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined) delete payload[k];
    });

    return payload;
  }

  guardar() {
    // Validaciones del frontend (las mismas que ya tenías)
    if (!this.persona.nombre || !this.persona.nombre.trim()) {
      this.mostrarMensajeError('El campo "Nombres" es obligatorio.');
      return;
    }

    const doc = this.persona.numeroDocumento ?? '';
    if (!doc.trim()) {
      const campo = this.persona.tipoPersona === 'Proveedor' ? 'RUC' : 'DNI';
      this.mostrarMensajeError(`El campo "${campo}" es obligatorio.`);
      return;
    }

    if (this.persona.tipoPersona === 'Cliente' && doc.length !== 8) {
      this.mostrarMensajeError('El DNI debe tener 8 dígitos.');
      return;
    }

    if (this.persona.tipoPersona === 'Proveedor' && doc.length !== 11) {
      this.mostrarMensajeError('El RUC debe tener 11 dígitos.');
      return;
    }

    // PREPARAR payload normalizado (convierte "" -> null)
    const payload = this.normalizeForSave(this.persona);
    console.log('Payload a enviar al backend:', payload);

    if (this.esEdicion && this.persona.idPersona) {
      this.personaService.updatePersona(this.persona.idPersona, payload).subscribe({
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
      this.personaService.createPersona(payload).subscribe({
        next: (personaCreada) => {
          const tipo = this.persona.tipoPersona === 'Proveedor' ? 'Proveedor' : 'Cliente';
          this.mostrarMensajeExito(`${tipo} registrado correctamente.`, personaCreada);
        },
        error: (err) => {
          console.error('Error al crear persona:', err);
          // Mostrar mensaje más legible si el backend devuelve ValidationProblemDetails
          const msg = err?.error?.errors ? JSON.stringify(err.error.errors) : err?.message || 'Ha ocurrido un error al registrar la persona.';
          this.mostrarMensajeError(msg);
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
