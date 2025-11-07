import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxPaginationModule } from 'ngx-pagination';

import { ProductoService } from '../../../services/producto.service';
import { VentaService } from '../../../services/venta.service';
import { TallaProductoService } from '../../../services/talla-producto.service';
import { PersonaService } from '../../../services/persona.service';
import { PersonaComponent } from '../../persona/nuevo-persona/persona.component';
import { InvoiceComponent } from '../../../invoice/invoice.component';
import { Persona } from '../../../models/persona.model';
import { AuthService } from '../../../services/auth.service';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    AutocompleteLibModule,
    PersonaComponent,
    InvoiceComponent
  ],
  templateUrl: './punto-venta.component.html',
  styleUrls: ['./punto-venta.component.css']
})
export class PuntoVentaComponent implements OnInit {
  // AUTOCOMPLETE
  keyword = 'nombre';
  allProducts: any[] = [];
  productosAutoComplete: any[] = [];
  productoBuscado = '';

  // ITEMS
  ventaItems: Array<{
    item: number;
    idProducto: number;
    codigo: string;
    nombre: string;
    cantidad: number;
    precio: number;
    talla?: string;
    stock?: number;
    idUnidadMedida?: number;
  }> = [];
  currentItemIndex: number | null = null;

  // MODALES
  mostrarModalTallas = false;
  tallasProducto: any[] = [];
  mostrarModalCliente = false;

  nuevoCliente: Persona = {
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    tipoPersona: 'Cliente',
    tipoDocumento: 'DNI',
    numeroDocumento: ''
  };

  ventaCreadaResponse: any = null;

  // TOTALES
  subTotal = 0;
  iva = 0;
  descuento = 0;
  total = 0;

  // DATOS VENTA
  documentoSeleccionado = '';
  personas: Persona[] = [];
  clienteSeleccionado: Persona | 'VARIOS' | null = null;

  mediosPago = ['Efectivo','Yape', 'Plin', 'Transferencia'];
  tipoPagoSeleccionado = '';
  serie = '';
  correlativo = '00000001';

  ultimoCorrelativoBoleta = 0;
  ultimoCorrelativoFactura = 0;

  montoEfectivo = 0;
  get vuelto() {
    return +(this.montoEfectivo - this.total).toFixed(2);
  }

  // PAGINACIÓN Y FILTRO
  currentPage: number = 1;
  itemsPerPageOptions: number[] = [5, 10, 25, 50];
  itemsPerPage: number = 10;
  searchTerm: string = '';

  get boleta() {
    if (!this.ventaCreadaResponse) return null;
    const vr = this.ventaCreadaResponse;
    return {
      serie: vr.serie,
      numeroComprobante: vr.numeroComprobante,
      fecha: vr.fecha,
      clienteNombre: vr.clienteNombre,
      clienteDocumento: vr.clienteDocumento,
      direccion: vr.direccion,
      moneda: 'S/',
      detalles: (vr.detalles ?? []).map((d: any) => ({
        cantidad: d.cantidad,
        descripcion: d.descripcion,
        precio: d.precio,
        descuento: d.descuento,
        total: d.total
      }))
    };
  }

  @ViewChild('reporteBoletaContainer', { static: false, read: ElementRef })
  reporteBoletaContainer!: ElementRef;

  @ViewChild(InvoiceComponent, { static: false })
  invoiceComponent!: InvoiceComponent;

  usuarioActual: string | null = null;


  constructor(
    private productoService: ProductoService,
    private ventaService: VentaService,
    private tallaProductoService: TallaProductoService,
    private personaService: PersonaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarPersonas();

    try {
      this.usuarioActual = this.authService.getUsername() ?? null;
    } catch {
      try {
        const raw = localStorage.getItem('username') || localStorage.getItem('usuario');
        this.usuarioActual = raw ? JSON.parse(raw)?.username ?? raw : null;
      } catch {
        this.usuarioActual = null;
      }
    }

    this.ultimoCorrelativoBoleta = parseInt(localStorage.getItem('ultimoCorrelativoBoleta') || '0', 10) || 0;
    this.ultimoCorrelativoFactura = parseInt(localStorage.getItem('ultimoCorrelativoFactura') || '0', 10) || 0;
  }


  private cargarProductos() {
    this.productoService.getAll().subscribe({
      next: data => {
        this.allProducts = data.map(p => ({
          idProducto: p.idProducto,
          codigo: p.codigoBarra,
          nombre: p.nombre,
          precio: p.precioVenta,
          stock: p.stock
        }));
        this.productosAutoComplete = [...this.allProducts];
        this.ventaItems.forEach(it => {
          const prod = this.allProducts.find(p => p.idProducto === it.idProducto);
          if (prod) it.stock = prod.stock;
        });
      },
      error: err => console.error(err)
    });
  }

  private cargarPersonas() {
    this.personaService.getAllPersonas().subscribe({
      next: p => {
        this.personas = (p || []).filter(persona => persona.tipoPersona === 'Cliente');
      },
      error: err => console.error(err)
    });
  }

  onChangeSearch(search: string) {
    this.productoBuscado = search;
    this.productosAutoComplete = search
      ? this.allProducts.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
      : [...this.allProducts];
  }
  onFocused(_: any) {}

  selectEvent(item: any) {
    this.ventaItems.push({
      item: this.ventaItems.length + 1,
      idProducto: item.idProducto,
      codigo: item.codigo,
      nombre: item.nombre,
      cantidad: 1,
      precio: item.precio,
      stock: item.stock
    });
    this.productoBuscado = '';
    this.calcularTotal();
  }

  cambiarCantidad(i: number, q: number) {
    if (q > 0) {
      this.ventaItems[i].cantidad = q;
      this.calcularTotal();
    }
  }

  eliminarItem(i: number) {
    this.ventaItems.splice(i, 1);
    this.ventaItems.forEach((it, idx) => (it.item = idx + 1));
    this.calcularTotal();
  }

  vaciarListado() {
    this.ventaItems = [];
    this.subTotal = this.iva = this.descuento = this.total = 0;
  }

  private calcularTotal() {
    // El precio del producto (it.precio) ya incluye el IGV.
    const totalVenta = this.ventaItems.reduce((acc, it) => acc + it.cantidad * it.precio, 0);

    // Para obtener el subtotal (base imponible), dividimos el total por 1.18 (asumiendo IGV del 18%).
    const subTotalCalculado = totalVenta / 1.18;
    const igvCalculado = totalVenta - subTotalCalculado;

    this.subTotal = +subTotalCalculado.toFixed(2);
    this.iva = +igvCalculado.toFixed(2);

    // El total es la suma de los precios de venta, menos cualquier descuento.
    this.total = +(totalVenta - this.descuento).toFixed(2);
  }


  onDocumentoChange() {
    if (this.documentoSeleccionado === 'Boleta') {
      this.serie = 'B001';
      this.correlativo = (this.ultimoCorrelativoBoleta + 1).toString().padStart(8, '0');
    } else if (this.documentoSeleccionado === 'Factura') {
      this.serie = 'F001';
      this.correlativo = (this.ultimoCorrelativoFactura + 1).toString().padStart(8, '0');
    } else {
      this.serie = '';
      this.correlativo = '00000001';
    }
  }

  mostrarTallas(item: any, idx: number) {
    this.currentItemIndex = idx;
    this.tallaProductoService.getTallasByProducto(item.idProducto).subscribe({
      next: t => {
        this.tallasProducto = t;
        console.log('Respuesta de getTallasByProducto:', t);
        this.mostrarModalTallas = true;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error cargando tallas. Intenta nuevamente.'
        });
      }
    });
  }

  cerrarModalTallas() {
    this.mostrarModalTallas = false;
    this.currentItemIndex = null;
  }

  seleccionarTalla(t: any) {
    if (this.currentItemIndex !== null) {
      this.ventaItems[this.currentItemIndex].talla = `${t.usa}/${t.eur}/${t.cm}`;
      this.ventaItems[this.currentItemIndex].idUnidadMedida = t.usa;
    }
    this.cerrarModalTallas();
  }

  abrirModalCliente() {
    this.nuevoCliente = {
      nombre: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipoPersona: 'Cliente',
      tipoDocumento: 'DNI',
      numeroDocumento: ''
    };
    this.mostrarModalCliente = true;
  }
  cerrarModalCliente() { this.mostrarModalCliente = false; }

  manejarPersonaCreada(p: Persona) {
    if (p && p.tipoPersona === 'Cliente') {
      this.personas.push(p);
      this.clienteSeleccionado = p;
    } else {
      console.warn('Se intentó agregar una persona que no es Cliente en Punto de Venta:', p);
    }
    this.cerrarModalCliente();
  }


  async realizarVenta(form: NgForm) {
    // ... (validaciones previas)
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: 'No se pudo obtener el ID del vendedor. Por favor, inicia sesión de nuevo.'
      });
      console.error("ERROR (Frontend): idUsuario is null. User might not be logged in correctly.");
      return;
    }

    if (this.ventaItems.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No hay productos',
        text: 'No hay productos en el listado. Por favor agrega productos antes de realizar la venta.'
      });
      console.log("DEBUG (Frontend): No hay items en la venta.");
      return;
    }

    if (!this.documentoSeleccionado || this.documentoSeleccionado.trim() === '') {
      await Swal.fire({
        icon: 'error',
        title: 'Documento requerido',
        text: 'Selecciona el tipo de documento (Boleta o Factura).'
      });
      return;
    }

    if (!this.clienteSeleccionado || (typeof this.clienteSeleccionado === 'string' && this.clienteSeleccionado !== 'VARIOS' && this.clienteSeleccionado === '')) {
      await Swal.fire({
        icon: 'error',
        title: 'Cliente requerido',
        text: 'Selecciona un cliente o agrega uno nuevo.'
      });
      return;
    }

    if (!this.tipoPagoSeleccionado || this.tipoPagoSeleccionado.trim() === '') {
      await Swal.fire({
        icon: 'error',
        title: 'Tipo de pago requerido',
        text: 'Selecciona el tipo de pago.'
      });
      return;
    }

    if (form.invalid) {
      console.log("DEBUG (Frontend): Formulario inválido.");
      await Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Completa los campos obligatorios marcados en el formulario.'
      });
      return;
    }

    if (this.montoEfectivo !== this.total) {
      await Swal.fire({
        icon: 'error',
        title: 'Monto recibido inválido',
        text: 'El monto recibido debe ser exactamente igual al total de la venta.'
      });
      console.log("DEBUG (Frontend): Monto recibido no es exacto.");
      return;
    }

    // --- MODIFICACIÓN TEMPORAL PARA PRESENTACIÓN ---
    // Forzamos los datos del cliente para la demostración.
    // El ID, nombre y documento siempre serán los de la Sra. Fidelina.
    const idPersonaFijo = 21;
    const clienteNombreFijo = 'CANCHUMANYA MACHA FIDELINA';
    const clienteDocumentoFijo = '41456648';
    const direccionFija = ''; // Dirección vacía como en la BD
    // --- FIN DE LA MODIFICACIÓN ---

    const confirmHtml = `
      <p>Vas a registrar una venta con <strong>${this.ventaItems.length}</strong> item(s).<br>
      Cliente: <strong>${clienteNombreFijo}</strong> (${clienteDocumentoFijo})<br>
      Documento: <strong>${this.documentoSeleccionado} - ${this.correlativo}</strong><br>
      Forma de pago: <strong>${this.tipoPagoSeleccionado}</strong><br>
      Total: <strong>S/ ${this.total.toFixed(2)}</strong></p>
      <div style="text-align:left; margin-top:10px;">
        <input type="checkbox" id="confirmChkPV" /> <label for="confirmChkPV"> Confirmo que los datos de la venta son correctos</label>
      </div>
    `;

    const confirmResult = await Swal.fire({
      title: 'Confirmar venta',
      html: confirmHtml,
      showCancelButton: true,
      confirmButtonText: 'Registrar venta',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const chk = (document.getElementById('confirmChkPV') as HTMLInputElement | null);
        if (!chk || !chk.checked) {
          Swal.showValidationMessage('Debes marcar la casilla para confirmar la venta.');
          return false;
        }
        return true;
      }
    });

    if (!confirmResult || !confirmResult.isConfirmed) {
      return;
    }

    const detalles = this.ventaItems.map(it => {
      const base = +(it.cantidad * it.precio).toFixed(2);
      return {
        idProducto: it.idProducto,
        IdTallaUsa: it.idUnidadMedida,
        descripcion: it.nombre,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precio: it.precio,
        talla: it.talla ?? '',
        descuento: 0,
        total: base,
        igv: 0 // IGV deshabilitado: siempre 0.00
      };
    });

    const vendedorNombre = this.usuarioActual || this.authService.getUsername?.() || 'PuntoVenta';
    const fechaPeruLocal = new Date().toLocaleString('sv', { timeZone: 'America/Lima' }); // "YYYY-MM-DD HH:MM:SS"
    const fechaPeruIsoWithOffset = fechaPeruLocal.replace(' ', 'T') + '-05:00';

    const payload: any = {
      idUsuario: idUsuario,
      idPersona: idPersonaFijo, // <-- ID FIJO para la presentación
      tipoComprobante: this.documentoSeleccionado,
      fecha: fechaPeruIsoWithOffset, // ISO aceptable por .NET
      total: this.total,
      estado: 'Emitido',
      serie: this.serie,
      numeroComprobante: this.correlativo,
      totalIgv: this.iva, // 0
      detalles: detalles,
      clienteNombre: clienteNombreFijo, // <-- Nombre fijo
      clienteDocumento: clienteDocumentoFijo, // <-- Documento fijo
      direccion: direccionFija, // <-- Dirección fija
      formaPago: this.tipoPagoSeleccionado,
      vendedor: vendedorNombre
    };

    this.ventaService.createVenta(payload).subscribe({
      next: resp => {
        if (this.documentoSeleccionado === 'Boleta') {
          const stored = Number(localStorage.getItem('ultimoCorrelativoBoleta') || '0');
          const newCount = Math.max(stored, this.ultimoCorrelativoBoleta) + 1;
          this.ultimoCorrelativoBoleta = newCount;
          localStorage.setItem('ultimoCorrelativoBoleta', String(newCount));
        } else if (this.documentoSeleccionado === 'Factura') {
          const stored = Number(localStorage.getItem('ultimoCorrelativoFactura') || '0');
          const newCount = Math.max(stored, this.ultimoCorrelativoFactura) + 1;
          this.ultimoCorrelativoFactura = newCount;
          localStorage.setItem('ultimoCorrelativoFactura', String(newCount));
        }

        const detallesResp = this.ventaItems.map(it => {
          const base = +(it.cantidad * it.precio).toFixed(2);
          return {
            idProducto: it.idProducto,
            IdTallaUsa: it.idUnidadMedida,
            descripcion: it.nombre,
            nombre: it.nombre,
            cantidad: it.cantidad,
            precio: it.precio,
            talla: it.talla ?? '',
            descuento: 0,
            total: base,
            igv: 0 // IGV 0 también en la respuesta local
          };
        });

        this.ventaCreadaResponse = Object.assign({}, resp, {
          clienteNombre: clienteNombreFijo, // Usar el nombre fijo en la respuesta
          clienteDocumento: clienteDocumentoFijo, // Usar el documento fijo
          direccion: direccionFija, // Usar la dirección fija
          formaPago: this.tipoPagoSeleccionado,
          vendedor: vendedorNombre,
          serie: this.serie,
          numeroComprobante: this.correlativo,
          fecha: fechaPeruIsoWithOffset, // <-- usar la variable correcta
          moneda: 'S/',
          detalles: (detallesResp || []).map(d => ({
            cantidad: d.cantidad,
            precio: d.precio,
            total: d.total,
            descripcion: d.descripcion,
            nombre: d.nombre,
            talla: d.talla,
            desc: d.descuento ?? 0
          }))
        });

        this.cargarProductos();
        this.vaciarListado();
        this.resetearFormularioVenta();
        console.log("DEBUG (Frontend): Venta creada exitosamente con cliente fijo (ID 21).");

        Swal.fire({
          icon: 'success',
          title: 'Venta registrada',
          html: `<p>Venta registrada con éxito.</p>`,
          showCancelButton: true,
          confirmButtonText: 'Imprimir comprobante',
          cancelButtonText: 'Cerrar'
        }).then(choice => {
          if (choice.isConfirmed) {
            this.imprimirComprobante();
          }
        });
      },
      error: err => {
        console.error("ERROR (Frontend): Error al crear la venta:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error interno al crear la venta. Revisa la consola para más detalles.'
        });
      }
    });

  }

  resetearFormularioVenta(): void {
    this.documentoSeleccionado = '';
    this.clienteSeleccionado = null;
    this.tipoPagoSeleccionado = '';
    this.serie = '';
    this.correlativo = '00000001';
    this.montoEfectivo = 0;
  }


  async imprimirComprobante() {
    try {
      if (this.invoiceComponent) {
        await this.invoiceComponent.generateBarcode();
        await this.invoiceComponent.generateQr();
      }

      await new Promise(res => setTimeout(res, 300));

      const html = this.reporteBoletaContainer.nativeElement.innerHTML;

      const popup = window.open('', '_blank', 'width=900,height=900');
      if (!popup) {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo abrir ventana',
          text: 'No se pudo abrir la ventana de impresión. Revisa bloqueadores de pop-ups.'
        });
        return;
      }

      popup.document.write(`
        <html>
          <head>
            <meta charset="utf-8"/>
            <title>Comprobante</title>
            <style>
              body{font-family:'Poppins', sans-serif; margin:8px;}
            </style>
          </head>
          <body>${html}</body>
        </html>
      `);
      popup.document.close();

      await new Promise(res => setTimeout(res, 350));

      popup.focus();
      popup.print();
    } catch (err) {
      console.error('Error en imprimirComprobante:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error preparando la boleta para impresión. Revisa la consola'
      });
    }
  }

  get filteredVentaItems() {
    if (!this.searchTerm) return this.ventaItems;
    const term = this.searchTerm.toLowerCase();
    return this.ventaItems.filter(it =>
      (it.nombre || '').toLowerCase().includes(term) ||
      (it.codigo || '').toLowerCase().includes(term)
    );
  }

  get displayedFrom(): number {
    const total = this.filteredVentaItems.length;
    if (total === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get displayedTo(): number {
    const total = this.filteredVentaItems.length;
    const to = this.currentPage * this.itemsPerPage;
    return to > total ? total : to;
  }

  getGlobalIndex(indexOnPage: number): number {
    const pageItems = this.filteredVentaItems.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
    const item = pageItems[indexOnPage];
    if (!item) return indexOnPage;
    const realIndex = this.ventaItems.findIndex(it => it === item);
    return realIndex >= 0 ? realIndex : indexOnPage;
  }

  pageChanged(newPage: number) {
    this.currentPage = newPage;
  }
}
