import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Compra {
  fecha: string;
  tipoDoc: string;
  proveedor: string;
  formaPago: string;
  serie: string;
  nroDoc: string;
  subtotal: number;
  igv: number;
  total: number;
}

@Component({
  selector: 'app-ingresar-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ingresar.component.html',
  styleUrls: ['./ingresar.component.css']
})
export class IngresarComprasComponent {
  compra: Compra = {
    fecha: new Date().toISOString().substring(0,10),
    tipoDoc: 'Boleta',
    proveedor: '',
    formaPago: 'Efectivo',
    serie: '0001',
    nroDoc: '00000001',
    subtotal: 0,
    igv: 0,
    total: 0
  };
}