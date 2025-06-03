import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CompraListado {
  fecha: string;
  proveedor: string;
  total: number;
}

@Component({
  selector: 'app-listado-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-compras.component.html',
  styleUrls: ['./listado-compras.component.css']
})
export class ListadoComprasComponent {
  filtro = '';
  compras: CompraListado[] = [
    { fecha: '2025-05-14', proveedor: 'Proveedor A', total: 150000 },
    { fecha: '2025-05-13', proveedor: 'Proveedor B', total: 230000 },
    { fecha: '2025-05-12', proveedor: 'Proveedor C', total:  98000 },
  ];

  get comprasFiltradas(): CompraListado[] {
    const term = this.filtro.toLowerCase();
    return this.compras.filter(c =>
      c.proveedor.toLowerCase().includes(term) ||
      c.fecha.toLowerCase().includes(term) ||
      c.total.toString().includes(term)
    );
  }
}
