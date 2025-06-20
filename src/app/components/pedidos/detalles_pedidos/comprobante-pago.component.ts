import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-pago.component.html',
  styleUrls: ['./comprobante-pago.component.css']
})
export class ComprobantePagoComponent {
  @Input() comprobante!: string;
  @Input() metodo!: string;
  @Output() cerrar = new EventEmitter<void>();
}