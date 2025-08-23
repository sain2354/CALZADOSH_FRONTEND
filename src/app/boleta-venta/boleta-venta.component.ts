import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import * as numeroALetras from 'numero-a-letras';

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
    // Intentar llamar a la función de diferentes maneras
    if (typeof (numeroALetras as any).default === 'function') {
      return (numeroALetras as any).default(n, {
        plural: 'SOLES',
        singular: 'SOL',
        centPlural: 'CENTIMOS',
        centSingular: 'CENTIMO'
      });
    } else if (typeof numeroALetras === 'function') {
      return (numeroALetras as any)(n, {
        plural: 'SOLES',
        singular: 'SOL',
        centPlural: 'CENTIMOS',
        centSingular: 'CENTIMO'
      });
    } else {
      console.error("numeroALetras function not found on imported module");
      return n.toFixed(2); // Fallback: return the number as a string
    }
  }
}