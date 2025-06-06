// src/app/components/ventas/punto-venta/punto-venta.component.ts 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxPaginationModule } from 'ngx-pagination';

import { ProductoService } from '../../../services/producto.service';
import { Producto } from '../../../models/producto.model';
import { VentaService } from '../../../services/venta.service';
import { Venta, DetalleVenta } from '../../../models/venta.model';
import { TallaService } from '../../../services/talla.service';
import { TallaProductoService } from '../../../services/talla-producto.service';

// Importamos el componente Persona
// Nota: el selector definido en PersonaComponent es 'app-persona-form'
import { PersonaComponent } from '../../persona/nuevo-persona/persona.component';
import { Persona } from '../../../models/persona.model';

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    AutocompleteLibModule,
    PersonaComponent  // Se importa para poder usar <app-persona-form> en el HTML
  ],
  templateUrl: './punto-venta.component.html',
  styleUrls: ['./punto-venta.component.css']
})
export class PuntoVentaComponent implements OnInit {

  // AUTOCOMPLETE
  keyword = 'nombre';  
  allProducts: any[] = [];
  productosAutoComplete: any[] = [];
  productoBuscado: string = '';

  // LISTA DE ITEMS
  ventaItems: Array<{
    item: number;
    idProducto: number;
    codigo: string;
    nombre: string;
    cantidad: number;
    precio: number;
    talla?: string;
    stock?: number;
  }> = [];

  // MODAL TALLAS
  mostrarModalTallas = false;
  tallasProducto: any[] = [];

  // TOTALES
  subTotal = 0;
  iva = 0;
  descuento = 0;
  total = 0;

  // DATOS DE VENTA
  documentoSeleccionado = 'seleccione';
  clientes = [
    { nombre: '000000 - Clientes Varios', idPersona: 1 },
    { nombre: 'Cliente 1', idPersona: 2 },
    { nombre: 'Cliente 2', idPersona: 3 }
  ];
  clienteSeleccionado = '000000 - Clientes Varios';
  tipoPagoSeleccionado = 'Seleccione Tipo Pago';
  serie = '';
  correlativo = '';
  efectivoExacto = false;
  montoEfectivo = 0;
  vuelto = 0;

  // MODAL Persona
  mostrarModalCliente = false;

  constructor(
    private productoService: ProductoService,
    private ventaService: VentaService,
    private tallaService: TallaService,
    private tallaProductoService: TallaProductoService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  // Cargar productos
  cargarProductos() {
    this.productoService.getAll().subscribe({
      next: (data: Producto[]) => {
        this.allProducts = data.map((p) => ({
          idProducto: p.idProducto,
          codigo: p.codigoBarra,
          nombre: p.nombre,
          precio: p.precioVenta,
          stock: p.stock
        }));
        this.productosAutoComplete = [...this.allProducts];
      },
      error: (err: any) => {
        console.error('Error al cargar productos:', err);
      }
    });
  }

  // Búsqueda manual en el autocomplete
  onChangeSearch(search: string) {
    this.productoBuscado = search;
    if (!search) {
      this.productosAutoComplete = [...this.allProducts];
    } else {
      this.productosAutoComplete = this.allProducts.filter(prod =>
        prod.nombre.toLowerCase().includes(search.toLowerCase())
      );
    }
  }
  onFocused(e: any) {}

  // Al seleccionar un producto del dropdown
  selectEvent(item: any) {
    const nuevoItem = {
      item: this.ventaItems.length + 1,
      idProducto: item.idProducto,
      codigo: item.codigo || '',
      nombre: item.nombre || '',
      cantidad: 1,
      precio: item.precio || 0,
      stock: item.stock || 0
    };
    this.ventaItems.push(nuevoItem);
    this.productoBuscado = '';
    this.calcularTotal();
  }

  // Manejo de items
  cambiarCantidad(index: number, nuevaCantidad: number) {
    if (nuevaCantidad <= 0) return;
    this.ventaItems[index].cantidad = nuevaCantidad;
    this.calcularTotal();
  }

  eliminarItem(index: number) {
    this.ventaItems.splice(index, 1);
    this.ventaItems.forEach((it, i) => it.item = i + 1);
    this.calcularTotal();
  }

  vaciarListado() {
    this.ventaItems = [];
    this.subTotal = 0;
    this.iva = 0;
    this.descuento = 0;
    this.total = 0;
  }

  // Calcular totales
  calcularTotal() {
    let totalParcial = 0;
    this.ventaItems.forEach(item => {
      totalParcial += (item.cantidad * item.precio);
    });
    this.subTotal = parseFloat(totalParcial.toFixed(2));
    this.iva = parseFloat((this.subTotal * 0.18).toFixed(2));
    this.total = parseFloat((this.subTotal + this.iva - this.descuento).toFixed(2));
  }

  // Mostrar Tallas
  mostrarTallas(item: any) {
    this.tallaProductoService.getTallasByProducto(item.idProducto).subscribe({
      next: (data: any[]) => {
        this.tallasProducto = data;
        this.mostrarModalTallas = true;
      },
      error: (err: any) => {
        console.error('Error al obtener tallas:', err);
        alert('No se pudieron cargar las tallas');
      }
    });
  }
  cerrarModalTallas() {
    this.mostrarModalTallas = false;
  }
  sumarStock(t: any) {
    alert(`Sumar stock a la talla: ${t.descripcion}. Implementa tu lógica aquí.`);
  }

  // Abrir/cerrar modal persona
  abrirModalCliente() {
    this.mostrarModalCliente = true;
  }
  cerrarModalCliente() {
    this.mostrarModalCliente = false;
  }

  // Manejar persona creada (recibe objeto de tipo Persona)
  manejarPersonaCreada(persona: Persona) {
    const nuevoNombre = `${persona.numeroDocumento} - ${persona.nombre}`;
    this.clientes.push({
      nombre: nuevoNombre,
      idPersona: persona.idPersona || 999
    });
    this.clienteSeleccionado = nuevoNombre;
    // Cierra el modal después de crear
    this.cerrarModalCliente();
  }

  // Registrar la venta
  realizarVenta() {
    let idPersona = 1;
    const clienteEncontrado = this.clientes.find(c => c.nombre === this.clienteSeleccionado);
    if (clienteEncontrado) {
      idPersona = clienteEncontrado.idPersona;
    }

    const detalle: DetalleVenta[] = this.ventaItems.map(item => {
      const totalItem = parseFloat((item.cantidad * item.precio).toFixed(2));
      const ivaItem = parseFloat((totalItem * 0.18).toFixed(2));
      return {
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precio: item.precio,
        descuento: 0,
        total: totalItem,
        igv: ivaItem
      };
    });

    const nuevaVenta: Venta = {
      idPersona,
      tipoComprobante: this.documentoSeleccionado,
      fecha: new Date().toISOString(),
      total: this.total,
      estado: 'Emitido',
      serie: this.serie,
      numeroComprobante: this.correlativo,
      totalIgv: this.iva,
      detalleVenta: detalle
    };

    this.ventaService.createVenta(nuevaVenta).subscribe({
      next: (ventaCreada) => {
        console.log('Venta registrada con éxito:', ventaCreada);
        alert('¡Venta realizada exitosamente!');
        // Reset
        this.vaciarListado();
        this.serie = '';
        this.correlativo = '';
        this.documentoSeleccionado = 'seleccione';
        this.clienteSeleccionado = '000000 - Clientes Varios';
        this.tipoPagoSeleccionado = 'Seleccione Tipo Pago';
      },
      error: (err: any) => {
        console.error('Error al registrar la venta:', err);
        alert('Ocurrió un error al registrar la venta.');
      }
    });
  }
}
