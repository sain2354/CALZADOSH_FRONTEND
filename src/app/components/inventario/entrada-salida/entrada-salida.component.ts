import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-entrada-salida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
        margin: 0;
        padding: 0;
      }

      .container {
        max-width: 500px;
        margin: 40px auto;
        background-color: #fff;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
      }

      h2, h3 {
        text-align: center;
        color: #333;
      }

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
      }

      input, select {
        width: 100%;
        padding: 10px;
        margin-bottom: 16px;
        border-radius: 4px;
        border: 1px solid #ccc;
        box-sizing: border-box;
      }

      button {
        width: 100%;
        padding: 12px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
      }

      button:disabled {
        background-color: #999;
        cursor: not-allowed;
      }

      ul {
        list-style-type: none;
        padding-left: 0;
      }

      li {
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 8px;
        border-radius: 4px;
      }

      hr {
        margin: 30px 0;
      }
    </style>

    <div class="container">
      <h2>Entradas y Salidas</h2>

      <form (ngSubmit)="registrarMovimiento()" #form="ngForm">
        <label for="producto">Producto:</label>
        <input
          id="producto"
          name="producto"
          [(ngModel)]="producto"
          required
        />

        <label for="cantidad">Cantidad:</label>
        <input
          id="cantidad"
          name="cantidad"
          type="number"
          [(ngModel)]="cantidad"
          required
          min="1"
        />

        <label for="tipo">Tipo:</label>
        <select id="tipo" name="tipo" [(ngModel)]="tipo" required>
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
        </select>

        <button type="submit" [disabled]="form.invalid">Registrar</button>
      </form>

      <hr />

      <h3>Movimientos Registrados</h3>
      <ul>
        <li *ngFor="let m of movimientos">
          {{ m.fecha | date: 'dd/MM/yy' }} - {{ m.producto }} - {{ m.cantidad }} - {{ m.tipo }}
        </li>
      </ul>
    </div>
  `,
})
export class EntradaSalidaComponent {
  producto = '';
  cantidad = 1;
  tipo = 'entrada';

  movimientos: { producto: string; cantidad: number; tipo: string; fecha: Date }[] = [];

  registrarMovimiento() {
    if (!this.producto.trim() || this.cantidad <= 0) return;

    this.movimientos.push({
      producto: this.producto.trim(),
      cantidad: this.cantidad,
      tipo: this.tipo,
      fecha: new Date(),
    });

    this.producto = '';
    this.cantidad = 1;
    this.tipo = 'entrada';
  }
}
