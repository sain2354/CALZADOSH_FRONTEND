// listado-productos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProductoService } from '../../../services/producto.service';
import { TallaService } from '../../../services/talla.service';
import { TallaProductoService } from '../../../services/talla-producto.service';
import { Producto, SizeWithStock, Promocion } from '../../../models/producto.model';
import { Talla } from '../../../models/talla.model';
import JsBarcode from 'jsbarcode';
import { Canvg } from 'canvg';
import { CategoriaService } from '../../../services/categoria.service';
import { Categoria } from '../../../models/categoria.model';

@Component({
  selector: 'app-listado-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    NgIf,
    AutocompleteLibModule
  ],
  templateUrl: './listado-productos.component.html',
  styleUrls: ['./listado-productos.component.css']
})
export class ListadoProductosComponent implements OnInit {
  page: number = 1;
  pageSize: number = 10;
  totalRegistros: number = 0;
  selectedCategory: number = 0;
  selectedGenero: string = '';
  selectedArticulo: string = '';
  selectedEstilo: string = '';
  showFilters: boolean = false;
  keyword = 'nombre';
  productosAutoComplete: any[] = [];
  filtro: string = '';
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: { id: number, nombre: string }[] = [];
  generos: string[] = ['Masculino', 'Femenino', 'Unisex'];
  articulos: string[] = ['Zapatillas', 'Sandalias', 'Botas', 'Zapatos'];
  estilos: string[] = ['Casual', 'Urbano', 'Deportivo', 'Fiesta'];

  subcategorias: { id: number, idCategoria: number, nombre: string }[] = [
    { id: 1, idCategoria: 1, nombre: 'Nike' },
    { id: 2, idCategoria: 1, nombre: 'Adidas' },
    { id: 3, idCategoria: 1, nombre: 'Puma' },
    { id: 4, idCategoria: 1, nombre: 'I-Run' },
    { id: 5, idCategoria: 1, nombre: 'Reebok' },
    { id: 6, idCategoria: 1, nombre: 'Casual' },
    { id: 7, idCategoria: 2, nombre: 'Deporte' },
    { id: 8, idCategoria: 3, nombre: 'Outdoor' },
    { id: 9, idCategoria: 2, nombre: 'Nike' },
    { id: 10, idCategoria: 2, nombre: 'Adidas' },
    { id: 11, idCategoria: 2, nombre: 'Puma' },
    { id: 12, idCategoria: 2, nombre: 'I-Run' },
    { id: 13, idCategoria: 2, nombre: 'Reebok' },
    { id: 14, idCategoria: 3, nombre: 'Nike' },
    { id: 15, idCategoria: 3, nombre: 'Adidas' },
    { id: 16, idCategoria: 3, nombre: 'Puma' },
    { id: 17, idCategoria: 3, nombre: 'I-Run' },
    { id: 18, idCategoria: 3, nombre: 'Reebok' }
  ];

  unidadesMedida: { id: number, nombre: string }[] = [
    { id: 1, nombre: 'Pieza' },
    { id: 2, nombre: 'Caja' },
    { id: 3, nombre: 'Par' }
  ];

  modalAbierto: boolean = false;
  producto: Producto = this.nuevoProducto();
  subcategoriasFiltradas: { id: number, nombre: string }[] = [];
  tallasDisponibles: Talla[] = [];
  tallaSeleccionadaId: number = 0;
  stockTallaSeleccionada: number = 0;
  tallasSeleccionadas: SizeWithStock[] = [];
  modalCodigoBarrasAbierto: boolean = false;
  productoParaCodigo: Producto | null = null;

  // Nuevas propiedades para los modales de confirmación
  modalConfirmacionAbierto: boolean = false;
  modalExitoAbierto: boolean = false;
  tipoOperacion: 'eliminar' | 'editar' = 'eliminar';
  productoParaOperacion: Producto | null = null;
  mensajeConfirmacion: string = '';
  mensajeExito: string = '';

  codigoBarrasData = {
    codigoProducto: '',
    tallaSeleccionada: '',
    fila: 1,
    columna: 1
  };

  archivoSeleccionado: File | null = null;
  imagenExistenteUrl: string | null = null;

  constructor(
    private productoService: ProductoService,
    private tallaService: TallaService,
    private tallaProductoService: TallaProductoService,
    private categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    this.cargarTallas();
    this.cargarCategorias();
    this.cargarProductos();
  }

  private cargarCategorias(): void {
    this.categoriaService.getAll().subscribe({
      next: (data: Categoria[]) => {
        this.categorias = (data || []).map(c => ({
          id: (c as any).idCategoria ?? (c as any).id ?? 0,
          nombre: (c as any).descripcion ?? (c as any).nombre ?? ''
        }));
      },
      error: (err: any) => {
        console.error('Error al cargar categorías desde backend:', err);
        if (!this.categorias || this.categorias.length === 0) {
          this.categorias = [
            { id: 1, nombre: 'Hombres' },
            { id: 2, nombre: 'Mujeres' },
            { id: 3, nombre: 'Infantil' }
          ];
        }
      }
    });
  }

  cargarTallas() {
    this.tallaService.getTallas().subscribe({
      next: (data) => {
        this.tallasDisponibles = data;
      },
      error: (err: any) => {
        console.error('Error al cargar tallas:', err);
      }
    });
  }

  cargarProductos() {
    this.productoService.getAll(
      this.selectedCategory,
      this.selectedGenero === 'Todos' ? null : this.selectedGenero,
      this.selectedArticulo === 'Todos' ? null : this.selectedArticulo,
      this.selectedEstilo === 'Todos' ? null : this.selectedEstilo
    ).subscribe({
      next: (lista) => {
        console.log('Productos cargados (primeros 2):', lista.slice(0, 2)); // ← Añade esto
        console.log('Campos de ejemplo:', {
          nombre: lista[0]?.nombre,
          articulo: lista[0]?.articulo,
          estilo: lista[0]?.estilo,
          genero: lista[0]?.genero,
          precioVenta: lista[0]?.precioVenta
        });
        
        this.productos = lista;
        this.productosAutoComplete = this.productos.map((p) => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          categoria: p.categoria
        }));
        this.productosFiltrados = [...this.productos];
        this.totalRegistros = this.productosFiltrados.length;
        this.aplicarFiltro();
      },
      error: (error: any) => {
        console.error('Error al obtener productos:', error);
        this.productos = [];
        this.productosFiltrados = [];
      }
    });
  }

  onGeneroChange(genero: string) {
    this.selectedGenero = genero;
    this.page = 1;
    this.cargarProductos();
  }

  onArticuloChange(articulo: string) {
    this.selectedArticulo = articulo;
    this.page = 1;
    this.cargarProductos();
  }

  onEstiloChange(estilo: string) {
    this.selectedEstilo = estilo;
    this.page = 1;
    this.cargarProductos();
  }

  onCategoryChange(cat: number) {
    this.selectedCategory = cat;
    this.page = 1;
    this.cargarProductos();

    if (this.modalAbierto) {
      const nombreCat = this.categorias.find(c => c.id === cat)?.nombre;
      this.cargarTallasPorCategoria(nombreCat);
      this.tallasSeleccionadas = [];
    }
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
  }

  siguientePagina() {
    const totalPages = Math.ceil(this.productosFiltrados.length / this.pageSize);
    if (this.page < totalPages) {
      this.page++;
    }
  }

  anteriorPagina() {
    if (this.page > 1) {
      this.page--;
    }
  }

  onPageChange(newPage: number) {
    this.page = newPage;
  }

  aplicarFiltro() {
    const texto = (this.filtro || '').toLowerCase();
    this.productosFiltrados = this.productos.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(texto) ||
        (p.categoria || '').toLowerCase().includes(texto) ||
        (p.genero || '').toLowerCase().includes(texto) ||
        (p.articulo || '').toLowerCase().includes(texto) ||
        (p.estilo || '').toLowerCase().includes(texto)
    );
    this.totalRegistros = this.productosFiltrados.length;
  }

  selectEvent(item: any) {
    this.filtro = item.nombre;
    this.aplicarFiltro();
  }

  onChangeSearch(search: string) {
    this.filtro = search;
    this.aplicarFiltro();
  }

  onFocused(e: any) {}

  actualizarSubcategorias() {
    this.subcategoriasFiltradas = this.subcategorias.filter(
      s => s.idCategoria === Number(this.producto.idCategoria)
    );
    this.producto.idSubCategoria = 0;

    const cat = this.categorias.find(c => c.id === this.producto.idCategoria)?.nombre;
    if (cat && cat !== 'Todos') {
      this.cargarTallasPorCategoria(cat);
    } else {
      this.cargarTallas();
    }

    this.tallasSeleccionadas = [];
    this.tallaSeleccionadaId = 0;
  }

  cargarTallasPorCategoria(categoriaNombre?: string) {
    this.tallaService.getTallas(categoriaNombre).subscribe({
      next: lista => {
        this.tallasDisponibles = lista;
      },
      error: (err: any) => console.error('Error al filtrar tallas:', err)
    });
  }

  // Método modificado para mostrar confirmación antes de guardar
  guardarProducto() {
    this.tipoOperacion = 'editar';
    this.productoParaOperacion = this.producto;
    this.mensajeConfirmacion = `¿Está seguro de ${this.producto.idProducto ? 'editar' : 'crear'} el producto "${this.producto.nombre}"?`;
    this.modalConfirmacionAbierto = true;
  }

  // Método que ejecuta la operación de guardar después de la confirmación
  ejecutarGuardarProducto() {
    const formData = new FormData();
    
    formData.append('IdCategoria', String(this.producto.idCategoria ?? 0));
    if (this.producto.idSubCategoria) {
      formData.append('IdSubCategoria', String(this.producto.idSubCategoria));
    }
    formData.append('CodigoBarra', this.producto.codigoBarra ?? '');
    formData.append('Nombre', this.producto.nombre ?? '');
    formData.append('Stock', String(this.producto.stock ?? 0));
    formData.append('StockMinimo', String(this.producto.stockMinimo ?? 0));
    formData.append('PrecioVenta', String(this.producto.precioVenta ?? 0));
    if (this.producto.precioCompra != null) {
      formData.append('PrecioCompra', String(this.producto.precioCompra));
    }
    formData.append('IdUnidadMedida', String(this.producto.idUnidadMedida ?? 0));
    formData.append('Estado', this.producto.estado ? 'true' : 'false');
    if (this.producto.mpn) {
      formData.append('Mpn', this.producto.mpn);
    }
    formData.append('ShippingInfo', this.producto.shippingInfo || '');
    if (this.producto.material) {
      formData.append('Material', this.producto.material);
    }
    if (this.producto.color) {
      formData.append('Color', this.producto.color);
    }
    if (this.producto.genero) {
      formData.append('Genero', this.producto.genero);
    }
    if (this.producto.articulo) {
      formData.append('Articulo', this.producto.articulo);
    }
    if (this.producto.estilo) {
      formData.append('Estilo', this.producto.estilo);
    }

    this.tallasSeleccionadas.forEach((talla, i) => {
      formData.append(`Sizes[${i}].Usa`, (talla.usa ?? '').toString());
      formData.append(`Sizes[${i}].Eur`, (talla.eur ?? '').toString());
      formData.append(`Sizes[${i}].Cm`, (talla.cm ?? '').toString());
      formData.append(`Sizes[${i}].Stock`, talla.stock.toString());
    });

    if (this.archivoSeleccionado) {
      formData.append(
        'imagen',
        this.archivoSeleccionado,
        this.archivoSeleccionado.name
      );
    }

    // Si es edición -> ENVIAR SIEMPRE FormData con PUT (backend consume multipart/form-data)
    if (this.producto.idProducto && this.producto.idProducto > 0) {
      this.productoService.updateProductoFormData(this.producto.idProducto, formData).subscribe({
        next: (productoActualizado) => {
          console.log('Producto actualizado con éxito (FormData PUT):', productoActualizado);
          this.cargarProductos();
          this.cerrarModal();
          this.mostrarExito('Producto editado correctamente');
        },
        error: (error: any) => {
          console.error('Error al actualizar el producto:', error);
          const serverMsg = extractServerMessage(error);
          alert('Error al actualizar el producto. Revisa la consola. ' + (serverMsg || ''));
        }
      });
    }
    // Si es nuevo
    else {
      // Si hay archivo -> POST multipart (createWithFile)
      if (this.archivoSeleccionado) {
        this.productoService.crearProductoConArchivo(formData).subscribe({
          next: (productoCreado) => {
            console.log('Producto creado con archivo con éxito:', productoCreado);
            this.cargarProductos();
            this.cerrarModal();
            this.mostrarExito('Producto creado correctamente');
          },
          error: (error: any) => {
            console.error('Error al crear producto (with file):', error);
            const serverMsg = extractServerMessage(error);
            alert('Error al crear producto (con imagen). Revisa consola. ' + (serverMsg || ''));
          }
        });
      } else {
        // Si backend soporta POST JSON para crear sin imagen:
        const payload: any = {
          CodigoBarra: this.producto.codigoBarra,
          Nombre: this.producto.nombre,
          Stock: this.producto.stock,
          StockMinimo: this.producto.stockMinimo,
          PrecioVenta: this.producto.precioVenta,
          PrecioCompra: this.producto.precioCompra,
          IdCategoria: this.producto.idCategoria,
          IdSubCategoria: this.producto.idSubCategoria,
          IdUnidadMedida: this.producto.idUnidadMedida,
          Estado: this.producto.estado,
          Genero: this.producto.genero,
          Articulo: this.producto.articulo,
          Estilo: this.producto.estilo,
          Mpn: this.producto.mpn,
          ShippingInfo: this.producto.shippingInfo,
          Material: this.producto.material,
          Color: this.producto.color,
          Sizes: this.tallasSeleccionadas.map(t => ({
            Usa: t.usa,
            Eur: t.eur,
            Cm: t.cm,
            Stock: t.stock
          }))
        };

        this.productoService.crearProducto(payload).subscribe({
          next: (productoCreado) => {
            console.log('Producto creado con éxito (JSON):', productoCreado);
            this.cargarProductos();
            this.cerrarModal();
            this.mostrarExito('Producto creado correctamente');
          },
          error: (error: any) => {
            console.error('Error al crear producto (JSON):', error);
            const serverMsg = extractServerMessage(error);
            alert('Error al crear producto. Revisa consola. ' + (serverMsg || ''));
          }
        });
      }
    }
  }

  agregarTalla() {
    if (!this.tallaSeleccionadaId || this.tallaSeleccionadaId === 0) {
      alert('Selecciona una talla');
      return;
    }

    if (!this.stockTallaSeleccionada || this.stockTallaSeleccionada <= 0) {
      alert('Ingresa un stock válido para la talla');
      return;
    }

    const tallaEncontrada = this.tallasDisponibles.find(
      (t) => t.idTalla === this.tallaSeleccionadaId
    );

    if (!tallaEncontrada) {
      alert('Talla no válida');
      return;
    }

    const yaExiste = this.tallasSeleccionadas.some(
      (t) => t.idTalla === this.tallaSeleccionadaId
    );

    if (yaExiste) {
      alert('Esta talla ya fue agregada.');
      return;
    }

    this.tallasSeleccionadas.push({
      idTalla: tallaEncontrada.idTalla,
      usa: tallaEncontrada.usa,
      eur: tallaEncontrada.eur,
      cm: tallaEncontrada.cm,
      stock: this.stockTallaSeleccionada
    });

    this.tallaSeleccionadaId = 0;
    this.stockTallaSeleccionada = 0;
  }

  eliminarTalla(index: number) {
    this.tallasSeleccionadas.splice(index, 1);
  }

  abrirModal() {
    console.log('Abriendo modal de nuevo producto');
    this.modalAbierto = true;
    this.producto = this.nuevoProducto();
    this.tallasSeleccionadas = [];
    this.subcategoriasFiltradas = [];
    this.cargarCategorias();

    const cat = this.categorias.find(c => c.id === this.producto.idCategoria)?.nombre;
    if (cat && cat !== 'Todos') {
      this.cargarTallasPorCategoria(cat);
    } else {
      this.cargarTallas();
    }
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.producto = this.nuevoProducto();
    this.tallasSeleccionadas = [];
    this.tallaSeleccionadaId = 0;
    this.stockTallaSeleccionada = 0;
    this.archivoSeleccionado = null;
    this.imagenExistenteUrl = null;
  }

  manejarFoto(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.archivoSeleccionado = archivo;
    }
  }

    private generarCodigoDeBarrasAleatorio(): string {
    // Genera un código numérico aleatorio de 13 dígitos
    const codigo = Math.floor(Math.random() * 10000000000000).toString();
    // Asegurarse de que siempre tenga 13 dígitos, rellenando con ceros si es necesario
    return codigo.padStart(13, '0');
  }

  private nuevoProducto(): Producto {
    return {
      idProducto: 0,
      codigoBarra: this.generarCodigoDeBarrasAleatorio(), // <--- ¡AQUÍ ESTÁ LA MAGIA!
      categoria: '',
      nombre: '',
      precioCompra: 0,
      precioVenta: 0,
      stock: 0,
      minStock: 0,
      estado: true,
      idCategoria: 0,
      idSubCategoria: 0,
      stockMinimo: 0,
      idUnidadMedida: 0,
      foto: '',
      mpn: '',
      shippingInfo: 'precio de delivery no incluido',
      material: '',
      color: '',
      genero: '',
      articulo: '',
      estilo: '',
      sizes: []
    };
  }

  editarProducto(prod: Producto) {
    // Normalizar la URL usando el servicio — previene '/uploads//uploads/...'
    this.imagenExistenteUrl = this.productoService.getImageFullUrl(prod.foto) ?? null;

    this.producto = {...prod};
    this.modalAbierto = true;
    this.producto.genero = prod.genero;
    this.producto.articulo = prod.articulo;
    this.producto.estilo = prod.estilo;

    if (prod.idProducto) {
      this.tallaProductoService.getTallasByProducto(prod.idProducto).subscribe({
        next: (tallas) => {
          this.tallasSeleccionadas = tallas.map(t => ({
            idTalla: t.idTalla,
            usa: t.usa,
            eur: t.eur,
            cm: t.cm,
            stock: t.stock
          }));
        },
        error: (err: any) => {
          console.error('Error al cargar tallas del producto:', err);
        }
      });
    }
  }

  generarCodigoBarras(prod: Producto) {
    this.productoParaCodigo = prod;
    const maxFila = 7;
    const maxColumna = 3;
    let fila = this.codigoBarrasData.fila;
    let columna = this.codigoBarrasData.columna;

    if (fila > maxFila) {
      console.warn(`El número máximo de filas recomendado es ${maxFila}. Se usará ${fila}.`);
    }

    if (columna > maxColumna) {
      alert(`El número máximo de columnas permitido es ${maxColumna}. Se usará ${maxColumna}.`);
      columna = maxColumna;
    }

    this.codigoBarrasData = {
      codigoProducto: prod.codigoBarra || '',
      tallaSeleccionada: '',
      fila: fila,
      columna: columna
    };

    if (prod.idProducto) {
      this.tallaProductoService.getTallasByProducto(prod.idProducto).subscribe({
        next: (tallas) => {
          this.tallasSeleccionadas = tallas.map(t => ({
            idTalla: t.idTalla,
            usa: t.usa,
            eur: t.eur,
            cm: t.cm,
            stock: t.stock
          }));
          this.modalCodigoBarrasAbierto = true;
        },
        error: (err: any) => {
          console.error('Error al cargar tallas del producto para código de barras:', err);
          alert('No se pudieron cargar las tallas para generar el código de barras.');
        }
      });
    } else {
      console.warn('Producto sin idProducto, no se pueden cargar las tallas para código de barras.');
      alert('No se puede generar código de barras para este producto (falta ID).');
    }
  }

  async generarPDFCodigoBarras() {
    if (!this.codigoBarrasData.tallaSeleccionada || this.codigoBarrasData.tallaSeleccionada === '') {
      return;
    }

    const tallaSeleccionadaCompleta = this.tallasSeleccionadas.find(
      t => t.usa === this.codigoBarrasData.tallaSeleccionada
    );

    const doc = new jsPDF('p', 'mm', 'a4');
    const labelWidth = 58.2;
    const labelHeight = 31.75;
    const barcodeWidth = 50;
    const barcodeHeight = 20;
    const margin = 2;
    const totalLabels = this.codigoBarrasData.fila * this.codigoBarrasData.columna;

    const tallaDisplay = tallaSeleccionadaCompleta ? 
      `USA ${tallaSeleccionadaCompleta.usa} — EUR ${tallaSeleccionadaCompleta.eur} — CM ${tallaSeleccionadaCompleta.cm}` : '';
    const productName = this.productoParaCodigo ? this.productoParaCodigo.nombre || '' : '';
    const productPrice = this.productoParaCodigo ? 
      this.productoParaCodigo.precioVenta?.toFixed(2) || '0.00' : '0.00';

    if (!this.productoParaCodigo) {
      return;
    }

    for (let i = 0; i < totalLabels; i++) {
      const row = Math.floor(i / this.codigoBarrasData.columna);
      const col = i % this.codigoBarrasData.columna;
      const rowStartY = row * (labelHeight + margin) + margin;
      const x = col * (labelWidth + margin) + margin;
      const y = rowStartY;

      if (y + labelHeight > doc.internal.pageSize.height - margin && i > 0) {
        doc.addPage();
      }

      doc.rect(x, y, labelWidth, labelHeight);

      const innerPaddingX = 1;
      const innerPaddingY = 1;

      doc.setFontSize(7);
      const productNameTextWidth = doc.getTextWidth(productName);
      const productNameX = x + innerPaddingX + (labelWidth - (innerPaddingX * 2) - productNameTextWidth) / 2;
      doc.text(productName, productNameX, y + innerPaddingY + 2.5);

      doc.setFontSize(7);
      const priceTextWidth = doc.getTextWidth(`S/ ${productPrice}`);
      const priceX = x + labelWidth - margin - priceTextWidth;
      doc.text(`S/ ${productPrice}`, priceX, y + 3.5);

      const barcodeAreaYOffset = 6;
      const barcodeAreaY = y + barcodeAreaYOffset;

      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svgElement, this.codigoBarrasData.codigoProducto || 'N/A', {
        format: "CODE128",
        width: 2,
        height: barcodeHeight,
        displayValue: false
      });

      const canvas = document.createElement('canvas');
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const ctx = canvas.getContext('2d')!;
      const v = await Canvg.from(ctx, svgString);
      await v.render();

      const barcodeDataURL = canvas.toDataURL('image/png');
      const barcodeImageX = x + innerPaddingX + (labelWidth - (innerPaddingX * 2) - barcodeWidth) / 2;
      doc.addImage(barcodeDataURL, 'PNG', barcodeImageX, barcodeAreaY, barcodeWidth, barcodeHeight);

      doc.setFontSize(7);
      const barcodeNumberText = this.codigoBarrasData.codigoProducto || 'N/A';
      const barcodeNumberTextWidth = doc.getTextWidth(barcodeNumberText);
      const barcodeNumberTextX = x + innerPaddingX + (labelWidth - (innerPaddingX * 2) - barcodeNumberTextWidth) / 2;
      const barcodeNumberTextY = barcodeAreaY + barcodeHeight + 1;
      doc.text(barcodeNumberText, barcodeNumberTextX, barcodeNumberTextY);

      doc.setFontSize(6);
      const tallaTextY = barcodeNumberTextY + 2.5;
      const tallaTextWidth = doc.getTextWidth(tallaDisplay);
      const tallaTextX = x + innerPaddingX + (labelWidth - (innerPaddingX * 2) - tallaTextWidth) / 2;
      doc.text(tallaDisplay, tallaTextX, tallaTextY);
    }

    const filename = this.productoParaCodigo ? 
      `codigos_barras_${this.productoParaCodigo.nombre}.pdf` : 'codigos_barras.pdf';
    doc.save(filename);

    this.cerrarModalCodigoBarras();
  }

  cerrarModalCodigoBarras(form?: any) {
    this.modalCodigoBarrasAbierto = false;
    this.productoParaCodigo = null;
    this.codigoBarrasData = {
      codigoProducto: '',
      tallaSeleccionada: '',
      fila: 1,
      columna: 1
    };
    if (form) {
      form.resetForm();
    }
  }

  // Método modificado para mostrar confirmación antes de eliminar
  eliminarProducto(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }

    this.tipoOperacion = 'eliminar';
    this.productoParaOperacion = prod;
    this.mensajeConfirmacion = `¿Desea eliminar el producto "${prod.nombre}"?`;
    this.modalConfirmacionAbierto = true;
  }

  // Método que ejecuta la eliminación después de la confirmación
  ejecutarEliminarProducto() {
    if (!this.productoParaOperacion?.idProducto) {
      return;
    }

    this.productoService.deleteProducto(this.productoParaOperacion.idProducto)
      .subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.idProducto !== this.productoParaOperacion?.idProducto);
          this.aplicarFiltro();
          this.mostrarExito('Producto eliminado correctamente');
        },
        error: (err: any) => {
          console.error('Error al eliminar producto:', err);
          const serverMsg = extractServerMessage(err);
          alert('Error al eliminar producto. Revisa la consola y los logs del servidor. Detalle: ' + (serverMsg || ''));
        }
      });
  }

  // ------------------- INICIO: Métodos de Catálogo / Excel / Imprimir -------------------

  // ---------- GENERAR CATÁLOGO PDF (mejorado con diseño más elegante) ----------
  async generarCatalogoPDF() {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;

      // Encabezado con logo de empresa y título elegante
      doc.setFillColor(41, 128, 185); // Azul elegante
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('CALZADOS HUANCAYO', pageWidth / 2, 12, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Catálogo de Productos', pageWidth / 2, 19, { align: 'center' });

      // Restablecer color de texto para el contenido
      doc.setTextColor(0, 0, 0);

      // Configuración de la cuadrícula mejorada
      const cols = 2;
      const gapX = 12;
      const gapY = 15;
      const cardW = (pageWidth - margin * 2 - gapX) / cols;
      const cardH = 98;
      const imgW = 55;
      const imgH = 55;
      
      let x = margin;
      let y = 35; // Comenzar después del encabezado

      const lista = (this.productosFiltrados && this.productosFiltrados.length > 0)
        ? this.productosFiltrados
        : this.productos || [];

      for (let i = 0; i < lista.length; i++) {
        const p = lista[i];

        // Nueva página si no cabe
        if (y + cardH > pageHeight - margin) {
          doc.addPage();
          // Repetir encabezado en nueva página
          doc.setFillColor(41, 128, 185);
          doc.rect(0, 0, pageWidth, 25, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(24);
          doc.setFont('helvetica', 'bold');
          doc.text('CALZADOS HUANCAYO', pageWidth / 2, 12, { align: 'center' });
          doc.setFontSize(14);
          doc.setFont('helvetica', 'normal');
          doc.text('Catálogo de Productos', pageWidth / 2, 19, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          
          y = 35;
          x = margin;
        }

        // Tarjeta con sombra y bordes redondeados (simulado)
        doc.setFillColor(248, 249, 250); // Fondo gris muy claro
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
        
        doc.setDrawColor(220, 220, 220); // Borde gris claro
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

        // Obtener imagen
        const imgUrl = this.productoService.getImageFullUrl((p as any).foto) ?? (p as any).foto ?? '';
        let imgData: string | null = null;

        if (imgUrl) {
          try {
            imgData = await this.productoService.fetchImageAsDataURL(imgUrl, 7000);
          } catch (e) {
            imgData = null;
          }
        }

        if (!imgData) {
          imgData = this.productoService.getPlaceholderImage();
        }

        // Añadir imagen con marco
        const imgX = x + 8;
        const imgY = y + 8;
        
        // Marco para la imagen
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(imgX - 2, imgY - 2, imgW + 4, imgH + 4, 2, 2, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(imgX - 2, imgY - 2, imgW + 4, imgH + 4, 2, 2, 'S');

        try {
          doc.addImage(imgData as string, 'JPEG', imgX, imgY, imgW, imgH);
        } catch {
          try {
            doc.addImage(imgData as string, 'PNG', imgX, imgY, imgW, imgH);
          } catch (e) {
            console.warn('No se pudo incrustar imagen en PDF para producto', p, e);
          }
        }

        // Información del producto con mejor diseño
        // Información del producto con mejor diseño
const textX = x + 8;
let lineY = y + imgH + 16; // AUMENTADO de 12 a 16 para bajar el nombre

// Nombre del producto (destacado)
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(52, 73, 94); // Azul oscuro
const nombreTexto = (p.nombre || 'Sin nombre').toString();
const nombreLines = doc.splitTextToSize(nombreTexto, cardW - 16);
doc.text(nombreLines, textX, lineY);

// Calcular altura del nombre para posicionar correctamente los demás elementos
const nombreHeight = nombreLines.length * 4; // Aproximadamente 4mm por línea

// Detalles del producto
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(127, 140, 141); // Gris

lineY += nombreHeight + 4; // Espacio después del nombre
doc.text(`Artículo: ${p.articulo || 'No especificado'}`, textX, lineY, { maxWidth: cardW - 16 });

lineY += 4;
doc.text(`Estilo: ${p.estilo || 'No especificado'}`, textX, lineY, { maxWidth: cardW - 16 });

lineY += 4;
doc.text(`Género: ${p.genero || 'No especificado'}`, textX, lineY, { maxWidth: cardW - 16 });

// Precio (destacado con fondo)
lineY += 6;
const precioTexto = p.precioVenta ? `S/ ${(p.precioVenta || 0).toFixed(2)}` : 'Precio no disponible';
doc.setFontSize(11);
doc.setFont('helvetica', 'bold');

if (p.precioVenta) {
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(46, 204, 113); // Verde
    const precioWidth = doc.getTextWidth(precioTexto) + 6;
    doc.roundedRect(textX, lineY - 3, precioWidth, 7, 2, 2, 'F');
    doc.text(precioTexto, textX + 3, lineY);
} else {
    doc.setTextColor(127, 140, 141); // Gris
    doc.text(precioTexto, textX, lineY);
}


        // Avanzar posición
        if ((i + 1) % cols === 0) {
          x = margin;
          y += cardH + gapY;
        } else {
          x += cardW + gapX;
        }
      }

      // Pie de página
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(127, 140, 141);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        doc.text('CALZADOS HUANCAYO - Catálogo de Productos', margin, pageHeight - 5);
      }

      doc.save('catalogo_calzados_huancayo.pdf');
    } catch (err) {
      console.error('Error al generar catálogo PDF:', err);
      alert('No se pudo generar el PDF del catálogo. Revisa la consola.');
    }
  }

  // Exportar a Excel usando xlsx
  exportarExcel() {
    try {
      const lista = (this.productosFiltrados && this.productosFiltrados.length > 0)
        ? this.productosFiltrados
        : this.productos || [];

      const data = lista.map(p => ({
        CodigoBarra: p.codigoBarra ?? '',
        Nombre: p.nombre ?? '',
        Articulo: p.articulo ?? '',
        Estilo: p.estilo ?? '',
        Genero: p.genero ?? '',
        PrecioVenta: p.precioVenta ?? 0,
        PrecioCompra: p.precioCompra ?? 0,
        Stock: p.stock ?? 0,
        Estado: p.estado ? 'Activo' : 'Inactivo'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      XLSX.writeFile(wb, 'catalogo_productos_calzados_huancayo.xlsx');
    } catch (err) {
      console.error('Error exportando Excel:', err);
      alert('No se pudo exportar a Excel. Revisa la consola.');
    }
  }

  // ---------- IMPRIMIR CATÁLOGO (vista mejorada y más elegante) ----------
  imprimirCatalogo() {
    try {
      const lista = (this.productosFiltrados && this.productosFiltrados.length > 0)
        ? this.productosFiltrados
        : this.productos || [];

      const style = `
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
            color: white; 
            text-align: center; 
            padding: 30px 20px;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #e74c3c, #f39c12, #f1c40f, #2ecc71, #3498db, #9b59b6);
          }
          .header h1 { 
            margin: 0 0 10px 0; 
            font-size: 2.5rem; 
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .header p { 
            margin: 0; 
            font-size: 1.2rem; 
            opacity: 0.9;
          }
          .catalog-content {
            padding: 40px 20px;
          }
          .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 25px; 
          }
          .product-card { 
            background: white;
            border-radius: 15px; 
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #f0f0f0;
          }
          .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          }
          .product-image { 
            width: 100%; 
            height: 200px; 
            object-fit: cover; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            display: block;
          }
          .product-info { 
            padding: 20px;
          }
          .product-name { 
            margin: 0 0 12px 0; 
            font-size: 1.3rem; 
            font-weight: 700;
            color: #2c3e50;
            line-height: 1.3;
          }
          .product-detail { 
            margin: 6px 0; 
            font-size: 0.95rem; 
            color: #7f8c8d;
            display: flex;
            align-items: center;
          }
          .detail-label {
            font-weight: 600;
            color: #34495e;
            min-width: 70px;
            margin-right: 8px;
          }
          .product-price { 
            font-weight: 800; 
            font-size: 1.4rem;
            color: white;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            padding: 8px 15px;
            border-radius: 25px;
            display: inline-block;
            margin-top: 15px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
          }
          .no-products {
            text-align: center;
            padding: 60px 20px;
            color: #7f8c8d;
            font-size: 1.2rem;
          }
          @media print { 
            body { background: white !important; padding: 0 !important; }
            .container { box-shadow: none !important; border-radius: 0 !important; }
            .product-card { box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important; break-inside: avoid; }
            .header { background: #2980b9 !important; }
          }
          @media (max-width: 768px) {
            .grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
            .header h1 { font-size: 2rem; }
            .catalog-content { padding: 20px 15px; }
          }
        </style>
      `;

      let html = `<html><head><title>Catálogo CALZADOS HUANCAYO</title><meta charset="UTF-8">${style}</head><body>`;
      html += `<div class="container">`;
      html += `<div class="header">
        <h1>CALZADOS HUANCAYO</h1>
        <p>Catálogo de Productos Premium</p>
      </div>`;
      html += `<div class="catalog-content">`;

      if (lista.length === 0) {
        html += `<div class="no-products">No hay productos disponibles para mostrar</div>`;
      } else {
        html += `<div class="grid">`;

        lista.forEach(p => {
          const raw = this.productoService.getImageFullUrl((p as any).foto) ?? (p as any).foto ?? '';
          const safeImg = raw || this.productoService.getPlaceholderImage();

          html += `
    <div class="product-card">
        <img class="product-image" src="${safeImg}" onerror="this.onerror=null;this.src='${this.productoService.getPlaceholderImage()}';"/>
        <div class="product-info">
            <h3 class="product-name">${p.nombre || 'Sin nombre'}</h3>
            <div class="product-detail">
                <span class="detail-label">Artículo:</span>
                <span>${p.articulo || 'No especificado'}</span>
            </div>
            <div class="product-detail">
                <span class="detail-label">Estilo:</span>
                <span>${p.estilo || 'No especificado'}</span>
            </div>
            <div class="product-detail">
                <span class="detail-label">Género:</span>
                <span>${p.genero || 'No especificado'}</span>
            </div>
            ${p.precioVenta ? 
                `<div class="product-price">S/ ${(p.precioVenta || 0).toFixed(2)}</div>` :
                `<div class="product-price" style="background: #e74c3c;">Precio no disponible</div>`
            }
        </div>
    </div>
`;

        });

        html += `</div>`;
      }
      
      html += `</div></div></body></html>`;

      const newWin = window.open('', '_blank');
      if (!newWin) { 
        alert('No se pudo abrir la vista de impresión. Revisa el bloqueador de popups.'); 
        return; 
      }
      newWin.document.open();
      newWin.document.write(html);
      newWin.document.close();
      newWin.focus();

      setTimeout(() => {
        newWin.print();
      }, 1000);
    } catch (err) {
      console.error('Error al imprimir catálogo:', err);
      alert('No se pudo imprimir el catálogo. Revisa la consola.');
    }
  }

  // ------------------- FIN: Métodos de Catálogo / Excel / Imprimir -------------------

  // Métodos para manejar los modales de confirmación y éxito
  confirmarOperacion() {
    this.modalConfirmacionAbierto = false;
    
    if (this.tipoOperacion === 'eliminar') {
      this.ejecutarEliminarProducto();
    } else if (this.tipoOperacion === 'editar') {
      this.ejecutarGuardarProducto();
    }
  }

  cancelarOperacion() {
    this.modalConfirmacionAbierto = false;
    this.productoParaOperacion = null;
  }

  mostrarExito(mensaje: string) {
    this.mensajeExito = mensaje;
    this.modalExitoAbierto = true;
  }

  cerrarModalExito() {
    this.modalExitoAbierto = false;
    this.mensajeExito = '';
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
}

/** Helper local: extrae mensaje útil del error HTTP (si existe) */
function extractServerMessage(err: any): string | null {
  try {
    if (!err) return null;
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error === 'object') return JSON.stringify(err.error);
    }
    if (err.message) return err.message;
    return JSON.stringify(err);
  } catch (e) {
    return null;
  }
}