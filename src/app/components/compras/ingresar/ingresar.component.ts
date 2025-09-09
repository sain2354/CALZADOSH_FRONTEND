import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompraService } from '../../../services/compra.service';
// Importar las interfaces necesarias
import { CompraRequest, ItemCompraRequest, ItemCompra, Compra } from '../../../models/compra.model';
import { ProductoService } from '../../../services/producto.service';
import { Producto, SizeWithStock } from '../../../models/producto.model';
import { PersonaService } from '../../../services/persona.service';
import { Persona } from '../../../models/persona.model';
import { MedioPagoService } from '../../../services/medio-pago.service';
import { MedioPago } from '../../../models/medio-pago.model';
import { TallaService } from '../../../services/talla.service';
import { Talla } from '../../../models/talla.model';
import { debounceTime, distinctUntilChanged, switchMap, forkJoin, catchError, firstValueFrom } from 'rxjs';
import { Subject, Observable, of } from 'rxjs';

// Importar componente de persona para abrir modal (standalone)
import { PersonaComponent } from '../../persona/nuevo-persona/persona.component';

// InvoiceComponent (para impresión/preview de boleta/factura)
import { InvoiceComponent } from '../../../invoice/invoice.component';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ingresar-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonaComponent, InvoiceComponent],
  templateUrl: './ingresar.component.html',
  styleUrls: ['./ingresar.component.css']
})
export class IngresarComprasComponent implements OnInit {
  compra: Compra = {
    fecha: new Date().toISOString().substring(0, 10),
    tipoDocumento: 'Boleta',
    idProveedor: 0,
    idFormaPago: 0,
    numeroDocumento: '00000001', // correlativo 8 dígitos
    serie: 'B001',                // serie por defecto para Boleta
    subtotal: 0,
    igv: 0,
    total: 0,
    items: []
  };

  terminoBusquedaProducto = new Subject<string>();
  productosEncontrados$: Observable<Producto[]> = of([]);
  productoSeleccionado: Producto | null = null;
  nombreProductoNuevoItem: string = '';

  proveedores: Persona[] = [];
  formasPago: MedioPago[] = [];
  listaTallasMaestra: Talla[] = [];

  tallasPorProducto: { [productId: number]: SizeWithStock[] } = {};

  modalTallaAbierto = false;
  itemEditandoTalla: ItemCompra | null = null;

  datosCargados = false;

  // *** CORREGIDO: Declarar las propiedades itemActual y tallaSeleccionada ***
  itemActual: ItemCompra = { // Declarar itemActual
    idProducto: 0,
    idTalla: 0,
    cantidad: 1,
    precioUnitario: 0,
    codigoBarra: undefined,
    nombreProducto: undefined,
    nombreTalla: undefined,
    stock: undefined,
    subtotalItem: undefined
  };
  tallaSeleccionada: any | null = null; // Declarar tallaSeleccionada (puedes tiparla mejor si sabes el tipo)

  // flags para control de correlativo
  private ultimoCorrelativoUsadoDesdeBackend: boolean = false;
  private ultimoCorrelativoCountBeforeAsign: number = 0; // número de compras ya registradas (antes de la nueva)

  // --- NUEVO: modal para crear proveedor desde el botón +
  mostrarModalProveedor: boolean = false;
  nuevoProveedor: Persona = {
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    tipoPersona: 'Proveedor',
    tipoDocumento: 'RUC',
    numeroDocumento: ''
  };

  // --- NUEVO: respuesta preparada para impresión/preview (boleta/factura)
  compraCreadaResponse: any = null;

  // ViewChilds para renderizar e imprimir el InvoiceComponent
  @ViewChild('reporteCompraContainer', { static: false, read: ElementRef })
  reporteCompraContainer!: ElementRef;

  @ViewChild(InvoiceComponent, { static: false })
  invoiceComponent!: InvoiceComponent;

  constructor(
    private compraService: CompraService,
    private productoService: ProductoService,
    private personaService: PersonaService,
    private medioPagoService: MedioPagoService,
    private tallaService: TallaService
  ) { }

  ngOnInit(): void {
    this.productosEncontrados$ = this.terminoBusquedaProducto.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((termino: string) => this.productoService.buscarProductos(termino))
    );

    forkJoin({
      proveedores: this.personaService.getAllPersonas(),
      formasPago: this.medioPagoService.getAllMediosPago(),
      tallasMaestras: this.tallaService.getTallas()
    }).subscribe({
      next: (results: { proveedores: Persona[], formasPago: MedioPago[], tallasMaestras: Talla[] }) => {
        // Guardamos sólo los proveedores (tipoPersona === 'Proveedor')
        this.proveedores = (results.proveedores || []).filter(p => (p.tipoPersona || '').toLowerCase() === 'proveedor');
        this.formasPago = results.formasPago || [];
        this.listaTallasMaestra = results.tallasMaestras || [];
        this.datosCargados = true;
        console.log('Datos iniciales cargados (Proveedores, Formas Pago, Tallas Maestras).');
      },
      error: (err: any) => {
        console.error('Error al cargar datos iniciales:', err);
        this.datosCargados = true;
      }
    });

    // Asignar correlativo/serie inicial según el tipo de documento por defecto
    this.asignarCorrelativoYSerie(this.compra.tipoDocumento);
  }

  // ------------------- LOGICA DE CORRELATIVO / SERIE -------------------

  // Llamada pública para cuando el usuario cambia el tipo de documento (select)
  onTipoDocumentoChange(): void {
    this.asignarCorrelativoYSerie(this.compra.tipoDocumento);
  }

  // Asigna compra.numeroDocumento y compra.serie llamando al resolver del backend (si existe) o fallback.
  private asignarCorrelativoYSerie(tipoDocumento: string) {
    this.obtenerCorrelativoYSerie(tipoDocumento).then(result => {
      this.compra.numeroDocumento = result.numero;
      this.compra.serie = result.serie;
      // Guardar info de cómo se calculó para decidir incrementos luego
      this.ultimoCorrelativoUsadoDesdeBackend = !!result.usedBackend;
      this.ultimoCorrelativoCountBeforeAsign = result.currentCountBeforeAssign ?? 0;
    }).catch(err => {
      console.warn('No se pudo obtener correlativo/serie desde el servicio, usando defaults:', err);
      // fallback por seguridad
      this.compra.serie = (tipoDocumento === 'Factura') ? 'F001' : 'B001';
      this.compra.numeroDocumento = this.padNumber(1, 8);
      this.ultimoCorrelativoUsadoDesdeBackend = false;
      this.ultimoCorrelativoCountBeforeAsign = 0;
    });
  }

  /**
   * Intenta obtener el correlativo basándose en:
   *  - conteo de compras en el backend (preferible)
   *  - si no hay un endpoint, usa sessionStorage como fallback
   *
   * Importante: NO actualiza sessionStorage en este método. sessionStorage solo se actualizará
   * cuando la compra se registre con éxito (realizarCompra -> success).
   *
   * Retorna: { numero, serie, usedBackend, currentCountBeforeAssign }
   *  - numero: cadena con padding (8 dígitos)
   *  - serie: 'B001' o 'F001'
   *  - usedBackend: true si el conteo provino del backend
   *  - currentCountBeforeAssign: número de compras ya registradas (antes de esta nueva)
   */
  private async obtenerCorrelativoYSerie(tipoDocumento: string): Promise<{ numero: string, serie: string, usedBackend: boolean, currentCountBeforeAssign: number }> {
    const svcAny = (this.compraService as any);
    const serie = (tipoDocumento === 'Factura') ? 'F001' : 'B001';

    // Métodos que podrían devolver un array de compras
    const candidateArrayMethods = [
      'getAllCompras', 'getCompras', 'listarCompras', 'obtenerCompras', 'getAll', 'listarAllCompras', 'fetchCompras'
    ];

    for (const name of candidateArrayMethods) {
      if (typeof svcAny[name] === 'function') {
        try {
          const maybe = svcAny[name]();
          let res: any;
          if (maybe && typeof maybe.subscribe === 'function') {
            // Observable
            try {
              res = await firstValueFrom(maybe.pipe(catchError(() => of(null))));
            } catch (err) {
              res = null;
            }
          } else if (maybe instanceof Promise) {
            res = await maybe;
          } else {
            res = maybe;
          }

          if (Array.isArray(res)) {
            // contar compras por tipo (ignorar numeroDocumento con formatos raros)
            const contarPorTipo = (c: any) => {
              const possibleTipo = c.tipoDocumento ?? c.TipoDocumento ?? c.tipo ?? c.Tipo ?? '';
              return typeof possibleTipo === 'string' && possibleTipo.toLowerCase() === tipoDocumento.toLowerCase();
            };
            const count = res.filter(contarPorTipo).length;
            const next = count + 1;
            return { numero: this.padNumber(next, 8), serie, usedBackend: true, currentCountBeforeAssign: count };
          }
        } catch (err) {
          console.warn(`Error llamando ${name} en compraService:`, err);
          // continuar probando otras opciones
        }
      }
    }

    // Si no encontramos método que devuelva array, intentar métodos que devuelvan la "última compra" por tipo
    const candidateLastMethods = [
      'obtenerUltimaCompraPorTipo', 'getUltimaCompraPorTipo', 'getLastCompraByTipo', 'getLastCompra', 'obtenerUltimaCompra', 'getUltimaCompra'
    ];
    for (const name of candidateLastMethods) {
      if (typeof svcAny[name] === 'function') {
        try {
          const maybe = svcAny[name].length > 0 ? svcAny[name](tipoDocumento) : svcAny[name]();
          let res: any;
          if (maybe && typeof maybe.subscribe === 'function') {
            try {
              res = await firstValueFrom(maybe.pipe(catchError(() => of(null))));
            } catch (err) {
              res = null;
            }
          } else if (maybe instanceof Promise) {
            res = await maybe;
          } else {
            res = maybe;
          }

          // Si devuelve objeto de "última compra", tratar de obtener count mediante su número (no ideal),
          // pero preferimos devolver next = lastCount + 1 si encontramos número.
          if (res && typeof res === 'object') {
            const posibleNumero = res.numeroDocumento ?? res.numero ?? res.nroDocumento ?? res.NroDocumento ?? null;
            if (posibleNumero) {
              // extraer dígitos y tomar como número (si backend no tiene conteo directo)
              const digits = String(posibleNumero).replace(/\D/g, '');
              const lastNum = parseInt(digits || '0', 10);
              const next = isNaN(lastNum) ? 1 : (lastNum + 1);
              // NOTE: aquí no conocemos el count real (solo inferimos desde último número),
              // marcaremos usedBackend=true porque vinimos del backend
              return { numero: this.padNumber(next, 8), serie, usedBackend: true, currentCountBeforeAssign: (isNaN(lastNum) ? 0 : lastNum) };
            }
          }
        } catch (err) {
          console.warn(`Error llamando ${name} en compraService:`, err);
        }
      }
    }

    // Fallback: usar sessionStorage para guardar el count de compras realizadas por tipo
    const key = (tipoDocumento === 'Factura') ? 'correlativo_count_factura' : 'correlativo_count_boleta';
    const stored = Number(sessionStorage.getItem(key) || '0'); // este valor representa cuántas compras ya se registraron
    const next = stored + 1;
    // Importante: NO escribimos sessionStorage aquí — solo escribiremos si la compra se registra con éxito.
    return { numero: this.padNumber(next, 8), serie, usedBackend: false, currentCountBeforeAssign: stored };
  }

  private padNumber(n: number, len = 8): string {
    const s = String(n);
    if (s.length >= len) return s;
    return '0'.repeat(len - s.length) + s;
  }

  // ------------------- FIN LOGICA CORRELATIVO / SERIE -------------------


  buscarProductos(event: Event): void {
    const termino = (event.target as HTMLInputElement).value;
    this.terminoBusquedaProducto.next(termino);
  }

  seleccionarProducto(producto: Producto): void {
    const itemExistente = this.compra.items.find((item: ItemCompra) => item.idProducto === producto.idProducto);

    if (itemExistente) {
        itemExistente.cantidad++;
        this.calcularTotales();

         const tallasDisponibles: SizeWithStock[] = this.getTallasForItem(itemExistente);
         if(tallasDisponibles.length > 0 && itemExistente.idTalla <= 0){
             this.abrirModalTallas(itemExistente);
         }

    } else {
        const nuevoItem: ItemCompra = {
            idProducto: producto.idProducto || 0,
            codigoBarra: producto.codigoBarra,
            nombreProducto: producto.nombre,
            cantidad: 1,
            precioUnitario: producto.precioVenta || 0,
            idTalla: 0,
            nombreTalla: 'Seleccione Talla',
            stock: (producto.sizes && producto.sizes.length > 0) ? 0 : (producto.stock || 0)
        };

        this.compra.items.push(nuevoItem);

        if (producto.idProducto) {
            this.tallasPorProducto[producto.idProducto] = producto.sizes || [];
        }

        this.calcularTotales();

        if(producto.sizes && producto.sizes.length > 0){
            this.abrirModalTallas(nuevoItem);
        }
    }

    this.nombreProductoNuevoItem = '';
    this.productosEncontrados$ = of([]);
    this.productoSeleccionado = null;
  }

  removerItem(index: number): void {
    if (index >= 0 && index < this.compra.items.length) {
      const itemIdProducto = this.compra.items[index].idProducto;
      const otrasInstancias = this.compra.items.filter((item: ItemCompra, i: number) => i !== index && item.idProducto === itemIdProducto);
      if (otrasInstancias.length === 0) {
         delete this.tallasPorProducto[itemIdProducto];
      }

      this.compra.items.splice(index, 1);
      this.calcularTotales();
    }
  }

  vaciarListado(): void {
    if (confirm('¿Estás seguro de que deseas vaciar el listado de productos de la compra?')) {
      this.compra.items = [];
      this.tallasPorProducto = {};
      this.calcularTotales();
    }
  }

  calcularTotales(): void {
    // MODIFICACIÓN: Eliminado el cálculo del IGV (18%)
    this.compra.subtotal = this.compra.items.reduce((sum: number, item: ItemCompra) => sum + (item.cantidad * item.precioUnitario), 0);
    this.compra.igv = 0; // IGV siempre será 0
    this.compra.total = parseFloat((this.compra.subtotal).toFixed(2)); // Total igual al subtotal
  }

  limpiarItemActual(): void {
    // *** CORREGIDO: Limpiar las propiedades de itemActual (ahora declarada) ***
    this.itemActual = {
      idProducto: 0,
      idTalla: 0,
      cantidad: 1,
      precioUnitario: 0,
       codigoBarra: undefined,
       nombreProducto: undefined,
       nombreTalla: undefined,
       stock: undefined,
       subtotalItem: undefined
    };
    this.productoSeleccionado = null;
    // *** CORREGIDO: Limpiar tallaSeleccionada (ahora declarada) ***
    this.tallaSeleccionada = null;
    this.tallasPorProducto = {};
  }

  // Hacemos el método async para manejar el modal de confirmación con await
  async realizarCompra(): Promise<void> {
      console.log('Ítems de la compra antes de validación de talla:', this.compra.items);
      console.log('Array formasPago en el frontend (antes de find):', this.formasPago);
      console.log('ID de forma de pago seleccionado en compra:', this.compra.idFormaPago);

    // Validaciones específicas antes de la confirmación
    if (!this.compra.items || this.compra.items.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Compra vacía',
        text: 'Por favor, agrega productos a la compra y completa los datos de la cabecera (Proveedor, Forma de Pago, Documento).'
      });
      return;
    }

    if (!this.compra.idProveedor || Number(this.compra.idProveedor) <= 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Proveedor requerido',
        text: 'Por favor selecciona un proveedor válido.'
      });
      return;
    }

    if (!this.compra.idFormaPago || Number(this.compra.idFormaPago) <= 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Forma de pago requerida',
        text: 'Por favor selecciona la Forma de Pago. (Campo obligatorio)'
      });
      return;
    }

    if (!this.compra.tipoDocumento || !this.compra.numeroDocumento) {
      await Swal.fire({
        icon: 'error',
        title: 'Documento requerido',
        text: 'Por favor completa el Documento (Tipo y Número). (Campo obligatorio)'
      });
      return;
    }

    const itemsConTallasIncompletas = this.compra.items.filter((item: ItemCompra) => {
         const tallasDisponibles: SizeWithStock[] = this.getTallasForItem(item);
         return tallasDisponibles.length > 0 && item.idTalla <= 0;
    });

    if(itemsConTallasIncompletas.length > 0){
        await Swal.fire({
          icon: 'warning',
          title: 'Tallas incompletas',
          text: 'Por favor, selecciona la talla para todos los productos que la requieren.'
        });
        return;
    }

    // Modal de confirmación con checkbox (requiere marcar para proceder)
    const confirmResult = await Swal.fire({
      title: 'Confirmar compra',
      html: `
        <p>Estás a punto de registrar la compra con ${this.compra.items.length} item(s).<br>
        Proveedor: <strong>${this.getProveedorNombre(this.compra.idProveedor)}</strong><br>
        Forma de pago: <strong>${this.getFormaPagoDescripcion(this.compra.idFormaPago)}</strong><br>
        Documento: <strong>${this.compra.tipoDocumento} - ${this.compra.numeroDocumento}</strong>
        </p>
        <div style="text-align:left; margin-top:10px;">
          <input type="checkbox" id="confirmChk" /> <label for="confirmChk"> Confirmo que los datos de la compra son correctos</label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar compra',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const chk = (document.getElementById('confirmChk') as HTMLInputElement | null);
        if (!chk || !chk.checked) {
          Swal.showValidationMessage('Debes marcar la casilla para confirmar la compra.');
          return false;
        }
        return true;
      }
    });

    if (!confirmResult || !confirmResult.isConfirmed) {
      // Usuario canceló o no confirmó
      return;
    }

    // Si llegó hasta aquí, procedemos a construir compraRequest y llamar al backend
    const formaPagoSeleccionada = this.formasPago.find((fp: MedioPago) => String(fp.idMedioPago) === String(this.compra.idFormaPago));
    const nombreFormaPago = formaPagoSeleccionada ? formaPagoSeleccionada.descripcion : '';

    const compraRequest: any = { // Cambiamos a 'any' temporalmente para permitir 'FormaPago' como string
        idProveedor: Number(this.compra.idProveedor),
        tipoDocumento: this.compra.tipoDocumento,
        numeroDocumento: this.compra.numeroDocumento,
        FormaPago: nombreFormaPago, // Enviamos el nombre de la forma de pago con 'F' mayúscula
        itemsCompra: this.compra.items.map((item: ItemCompra) => ({
            idProducto: item.idProducto,
            idTalla: item.idTalla,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario
        })),
        serie: this.compra.serie
    };

    console.log('Datos de compra enviados al backend:', compraRequest);

    this.compraService.crearCompra(compraRequest).subscribe({
      next: async (response: any) => {
        console.log('Compra registrada con éxito:', response);

        // Si usamos fallback (sessionStorage), actualizar el contador AHORA (solo cuando la compra se realiza)
        if (!this.ultimoCorrelativoUsadoDesdeBackend) {
          const key = (this.compra.tipoDocumento === 'Factura') ? 'correlativo_count_factura' : 'correlativo_count_boleta';
          const stored = Number(sessionStorage.getItem(key) || '0'); // compras ya registradas
          const newCount = Math.max(stored, this.ultimoCorrelativoCountBeforeAsign) + 1; // asegurar coherencia
          sessionStorage.setItem(key, String(newCount));
        }

        // --- PREPARAR respuesta para el InvoiceComponent (antes de resetear formulario)
        // Obtenemos objeto proveedor completo para traer RUC/DIRECCION/TELEFONO
        const proveedorObj = this.getProveedorById(this.compra.idProveedor);
        const proveedorNombre = proveedorObj?.nombre ?? this.getProveedorNombre(this.compra.idProveedor);
        // usar únicamente propiedades que existen: numeroDocumento y telefono
        const proveedorDocumento = proveedorObj?.numeroDocumento ?? '';
        const proveedorDireccion = proveedorObj?.direccion ?? '';
        const proveedorTelefono = proveedorObj?.telefono ?? '';

        const detallesParaInvoice = (this.compra.items || []).map((it: ItemCompra) => {
          const base = +(((it.cantidad || 0) * (it.precioUnitario || 0))).toFixed(2);
          return {
            cantidad: it.cantidad,
            descripcion: it.nombreProducto || '',
            precio: it.precioUnitario,
            total: base,
            talla: it.nombreTalla || ''
          };
        });

        // Mapear tanto con nombres propios (proveedor...) como con los que InvoiceComponent suele esperar (cliente...)
        this.compraCreadaResponse = Object.assign({}, response, {
          proveedorNombre,
          proveedorDocumento,
          proveedorDireccion,
          proveedorTelefono,

          // Campos mapeados para compatibilidad con InvoiceComponent que espera cliente*
          clienteNombre: proveedorNombre,
          clienteDocumento: proveedorDocumento,
          direccion: proveedorDireccion,
          telefono: proveedorTelefono,

          numeroComprobante: this.compra.numeroDocumento,
          serie: this.compra.serie,
          fecha: new Date().toISOString(),
          moneda: 'S/',
          formaPago: nombreFormaPago,
          detalles: detallesParaInvoice,
          total: this.compra.total,
          subtotal: this.compra.subtotal,
          igv: this.compra.igv
        });

        // Si backend fue usado, reasignamos el correlativo consultando de nuevo (el backend debería reflejar la nueva compra)
        // Si no, la asignación al fallback ya fue actualizada arriba.
        this.resetearFormularioCompra();
        // reasignar correlativo para el nuevo documento por defecto (será Boleta y buscará next)
        this.asignarCorrelativoYSerie(this.compra.tipoDocumento);

        // Mostrar opción de imprimir tras registrar (SweetAlert2)
        const printChoice = await Swal.fire({
          icon: 'success',
          title: 'Compra registrada',
          html: `<p>Compra registrada con éxito.</p>`,
          showCancelButton: true,
          confirmButtonText: 'Imprimir comprobante',
          cancelButtonText: 'Cerrar'
        });

        if (printChoice && printChoice.isConfirmed) {
          // Imprimir la boleta/factura de compra
          this.imprimirComprobanteCompra();
        }
      },
      error: async (error: any) => {
        console.error('Error al registrar la compra:', error);
         if (error.error && error.error.errors) {
              console.error('Detalles de validación del backend:', error.error.errors);
              let errorMessages = '<ul style="text-align:left;">';
              for (const key in error.error.errors) {
                  if (error.error.errors.hasOwnProperty(key)) {
                       error.error.errors[key].forEach((msg: string) => {
                           errorMessages += `<li><strong>${key}:</strong> ${msg}</li>`;
                       });
                  }
              }
              errorMessages += '</ul>';
              await Swal.fire({
                icon: 'error',
                title: 'Errores de validación del backend',
                html: errorMessages
              });
         } else if (error.error) {
              console.error('Cuerpo de respuesta del error:', error.error);
              await Swal.fire({
                icon: 'error',
                title: 'Error al registrar la compra',
                text: typeof error.error === 'string' ? error.error : JSON.stringify(error.error)
              });
         }
         else {
              await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al registrar la compra. Por favor, inténtalo de nuevo.'
              });
         }
      }
    });
  }

  // Función para imprimir la boleta/factura de compra usando InvoiceComponent
  async imprimirComprobanteCompra() {
    try {
      if (this.invoiceComponent && typeof this.invoiceComponent.generateBarcode === 'function') {
        await this.invoiceComponent.generateBarcode();
      }
      if (this.invoiceComponent && typeof this.invoiceComponent.generateQr === 'function') {
        await this.invoiceComponent.generateQr();
      }

      // Espera corta para que las imágenes (dataURL o externas) terminen de asignarse
      await new Promise(res => setTimeout(res, 300));

      const html = this.reporteCompraContainer.nativeElement.innerHTML;
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
            <title>Comprobante de Compra</title>
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
      console.error('Error en imprimirComprobanteCompra:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error preparando el comprobante para impresión. Revisa la consola.'
      });
    }
  }

  resetearFormularioCompra(): void {
    // *** Usar la interfaz Compra para inicializar ***
    this.compra = {
      fecha: new Date().toISOString().substring(0, 10),
      tipoDocumento: 'Boleta',
      idProveedor: 0,
      idFormaPago: 0,
      numeroDocumento: '00000001',
      serie: 'B001',
      subtotal: 0,
      igv: 0,
      total: 0,
      items: []
    };
    this.productoSeleccionado = null;
    this.nombreProductoNuevoItem = '';
    this.tallasPorProducto = {};
    // reasignar correlativo/serie por si usamos backend o sessionStorage
    this.asignarCorrelativoYSerie(this.compra.tipoDocumento);
     // No necesitas resetear listaTallasMaestra
  }

  abrirModalTallas(item: ItemCompra): void {
      const tallasDisponibles: SizeWithStock[] = this.getTallasForItem(item);
      if(tallasDisponibles.length === 0){
          // reemplazamos alert por Swal
          Swal.fire({
            icon: 'info',
            title: 'Sin tallas',
            text: 'Este producto no tiene tallas definidas.'
          });
          return;
      }

      this.itemEditandoTalla = item;
      this.modalTallaAbierto = true;
  }

  cerrarModalTallas(): void {
      this.modalTallaAbierto = false;
      this.itemEditandoTalla = null;
  }

  getTallasForEditingItem(): SizeWithStock[] {
     return this.itemEditandoTalla ? (this.tallasPorProducto[this.itemEditandoTalla.idProducto] || []) : [];
  }

  seleccionarTallaModal(tallaProducto: SizeWithStock): void {
      console.log('Talla de Producto seleccionada en modal (desde TallaProducto):', tallaProducto);

      if(this.itemEditandoTalla){
          const tallaMaestraEncontrada = this.listaTallasMaestra.find((t: Talla) => String(t.usa) === String(tallaProducto.usa));

          if (tallaMaestraEncontrada) {
              this.itemEditandoTalla.idTalla = tallaMaestraEncontrada.idTalla || 0;
              this.itemEditandoTalla.nombreTalla = tallaMaestraEncontrada.usa?.toString() || tallaMaestraEncontrada.eur?.toString() || tallaMaestraEncontrada.cm?.toString() || 'N/A';
              this.itemEditandoTalla.stock = tallaProducto.stock;

              console.log('Talla Maestra encontrada (desde tabla Talla):', tallaMaestraEncontrada);
              console.log('Item actualizado después de seleccionar talla (con idTalla de tabla Talla):', this.itemEditandoTalla);

              this.calcularTotales();
              this.cerrarModalTallas();
          } else {
              console.error('No se encontró la talla maestra correspondiente para el valor USA:', tallaProducto.usa);
              Swal.fire({
                icon: 'error',
                title: 'Error de tallas',
                text: 'Error: No se pudo encontrar la información completa de la talla seleccionada.'
              });
          }

      }
  }

  getTallasForItem(item: ItemCompra): SizeWithStock[] {
     return item.idProducto ? (this.tallasPorProducto[item.idProducto] || []) : [];
  }

  // ------------------- NUEVAS FUNCIONES PARA PROVEEDOR (botón +) -------------------

  abrirModalProveedor() {
    // preparar el objeto para abrir el formulario en modo "Proveedor"
    this.nuevoProveedor = {
      nombre: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipoPersona: 'Proveedor',
      tipoDocumento: 'RUC',
      numeroDocumento: ''
    };
    this.mostrarModalProveedor = true;
  }

  cerrarModalProveedor() {
    this.mostrarModalProveedor = false;
  }

  // Maneja el evento cuando el componente persona emite onGuardar con el proveedor creado
  manejarProveedorCreado(p: Persona) {
    if (!p) {
      console.warn('Proveedor creado es nulo o indefinido');
      this.cerrarModalProveedor();
      return;
    }

    // Agregar al array de proveedores en la UI
    this.proveedores.push(p);

    // Seleccionar automáticamente el nuevo proveedor en la compra (buscar idPersona)
    const id = (p as any).idPersona ?? (p as any).id ?? (p as any).idProveedor ?? 0;
    if (id) {
      this.compra.idProveedor = id;
    } else {
      // si no viene id, intentar seleccionar por número de documento
      this.compra.idProveedor = 0;
    }

    this.cerrarModalProveedor();
  }

  // -------------------------------------------------------------------------------
  // Helpers para mostrar nombres en el modal de confirmación
  private getProveedorNombre(idProveedor: number | any): string {
    const p = this.proveedores.find(pr => String(pr.idPersona) === String(idProveedor) || String((pr as any).id) === String(idProveedor));
    return p ? p.nombre : 'N/A';
  }

  private getFormaPagoDescripcion(idFormaPago: number | any): string {
    const fp = this.formasPago.find(f => String(f.idMedioPago) === String(idFormaPago));
    return fp ? fp.descripcion : 'N/A';
  }

  // Nuevo helper: devolver objeto proveedor completo por id (usa las propiedades que expones en Persona)
  private getProveedorById(idProveedor: number | any): Persona | null {
    if (!idProveedor) return null;
    const p = this.proveedores.find(pr =>
      String(pr.idPersona) === String(idProveedor) ||
      String((pr as any).id) === String(idProveedor) ||
      String((pr as any).idProveedor) === String(idProveedor) ||
      String(pr.numeroDocumento || '') === String(idProveedor)
    );
    return p ?? null;
  }

}
