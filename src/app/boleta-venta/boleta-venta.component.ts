import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import numeroALetras from 'numero-a-letras';

@Component({
  selector: 'app-boleta-venta',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './boleta-venta.component.html',
  styleUrls: ['./boleta-venta.component.css']
})
export class BoletaVentaComponent {
  @Input() venta!: any;

  get gravadas(): number {
    return this.venta.detalles
      .reduce((sum: number, d: any) => sum + (d.precio - d.descuento) * d.cantidad, 0);
  }

  get totalIgv(): number {
    return +(this.gravadas * 0.18).toFixed(2);
  }

  get totalDesc(): number {
    return this.venta.detalles
      .reduce((sum: number, d: any) => sum + d.descuento * d.cantidad, 0);
  }

  get total(): number {
    return +this.venta.detalles
      .reduce((sum: number, d: any) => sum + d.total, 0)
      .toFixed(2);
  }

  toLetras(n: number): string {
    // Llamamos directamente a la función importada
    return numeroALetras(n, {
      plural: 'SOLES',
      singular: 'SOL',
      centPlural: 'CENTIMOS',
      centSingular: 'CENTIMO'
    });
  }
}
