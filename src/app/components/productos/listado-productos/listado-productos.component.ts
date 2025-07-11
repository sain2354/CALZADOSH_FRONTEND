// listado-productos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { jsPDF } from 'jspdf';

import { ProductoService } from '../../../services/producto.service';
import { TallaService } from '../../../services/talla.service';
import { TallaProductoService } from '../../../services/talla-producto.service';
import { Producto, SizeWithStock } from '../../../models/producto.model';
import { Talla } from '../../../models/talla.model';

@Component({
  selector: 'app-listado-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    AutocompleteLibModule
  ],
  templateUrl: './listado-productos.component.html',
  styleUrls: ['./listado-productos.component.css']
})
export class ListadoProductosComponent implements OnInit {
  // ============ PAGINACIÓN Y FILTROS ============
  page: number = 1;
  pageSize: number = 10;
  totalRegistros: number = 0;
  selectedCategory: number = 0; // 0 => Todos, 1 => Hombres, 2 => Mujeres, 3 => Infantil

  // ============ AUTOCOMPLETE ============
  keyword = 'nombre';
  productosAutoComplete: any[] = [];

  // Filtro interno (por nombre/categoría, etc.)
  filtro: string = '';

  // Lista de productos
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  // Listas para combos
  categorias: { id: number, nombre: string }[] = [
    { id: 0, nombre: 'Todos' },
    { id: 1, nombre: 'Hombres' },
    { id: 2, nombre: 'Mujeres' },
    { id: 3, nombre: 'Infantil' }
  ];

  // Subcategorías (ejemplo)
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

  // Modal
  modalAbierto: boolean = false;
  producto: Producto = this.nuevoProducto();
  subcategoriasFiltradas: { id: number, nombre: string }[] = [];

  // Tallas
  tallasDisponibles: Talla[] = [];
  tallaSeleccionadaId: number = 0;
  stockTallaSeleccionada: number = 0;
  tallasSeleccionadas: SizeWithStock[] = [];

  // Modal código de barras
  modalCodigoBarrasAbierto: boolean = false;
  productoParaCodigo: Producto | null = null;
  codigoBarrasData = {
    codigoProducto: '',
    tallaSeleccionada: '',
    fila: 1,
    columna: 1
  };

  // Aquí guardaremos el archivo seleccionado (en vez de usar base64)
  archivoSeleccionado: File | null = null;

  constructor(
    private productoService: ProductoService,
    private tallaService: TallaService,
    private tallaProductoService: TallaProductoService
  ) {}

  ngOnInit(): void {
    this.cargarTallas();
    this.cargarProductos();
  }

  // ============ CARGAR TALLAS ============
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

  // ============ CARGAR PRODUCTOS ============
  cargarProductos() {
    this.productoService.getAll(this.selectedCategory).subscribe({
      next: (lista) => {
        this.productos = lista;

        // Para Autocomplete
        this.productosAutoComplete = this.productos.map((p) => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          categoria: p.categoria
        }));

        // Filtro interno
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

  // ============ FILTRO INTERNO ============
  aplicarFiltro() {
    const texto = this.filtro.toLowerCase();
    this.productosFiltrados = this.productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria?.toLowerCase().includes(texto)
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

  // ============ SUBCATEGORÍAS ============
  actualizarSubcategorias() {
    // 1) Filtras subcategorías
    this.subcategoriasFiltradas = this.subcategorias.filter(
      s => s.idCategoria === Number(this.producto.idCategoria)
    );
    this.producto.idSubCategoria = 0;

    // 2) Determinas la categoría elegida
    const cat = this.categorias.find(c => c.id === this.producto.idCategoria)?.nombre;
    console.log('[DEBUG] actualizarSubcategorias → categoria elegida:', cat);

    // 3) Lógicas de carga
    if (cat && cat !== 'Todos') {
      console.log('[DEBUG] Llamo a cargarTallasPorCategoria con:', cat);
      this.cargarTallasPorCategoria(cat);
    } else {
      console.log('[DEBUG] Llamo a cargarTallas() (todos)');
      this.cargarTallas();
    }

    // 4) Limpieza UI
    this.tallasSeleccionadas = [];
    this.tallaSeleccionadaId = 0;
  }

  cargarTallasPorCategoria(categoriaNombre?: string) {
    console.log('[DEBUG] pedir tallas al servicio con filtro:', categoriaNombre);
    this.tallaService.getTallas(categoriaNombre).subscribe({
      next: lista => {
        console.log('[DEBUG] respuesta getTallas:', lista);
        this.tallasDisponibles = lista;
      },
      error: (err: any) => console.error('Error al filtrar tallas:', err)
    });
  }

  // ============ GUARDAR PRODUCTO ============
  guardarProducto() {
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

    // Campos adicionales
   // — Campos adicionales —
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

// — Array de tallas enriquecidas —
this.tallasSeleccionadas.forEach((talla, i) => {
  formData.append(`Sizes[${i}].Usa`,   talla.usa.toString());
  formData.append(`Sizes[${i}].Eur`,   talla.eur.toString());
  formData.append(`Sizes[${i}].Cm`,    talla.cm.toString());
  formData.append(`Sizes[${i}].Stock`, talla.stock.toString());
});

// — Imagen —
if (this.archivoSeleccionado) {
  formData.append(
    'imagen',
    this.archivoSeleccionado,
    this.archivoSeleccionado.name
  );
}


    // Si es edición
    if (this.producto.idProducto && this.producto.idProducto > 0) {
      this.productoService.updateProducto(this.producto.idProducto, formData).subscribe({
        next: (productoActualizado) => {
          console.log('Producto actualizado con éxito:', productoActualizado);
          if (productoActualizado.idProducto && this.tallasSeleccionadas.length) {
            this.guardarTallasProducto(productoActualizado.idProducto);
          } else {
            this.cargarProductos();
            this.cerrarModal();
          }
        },
        error: (error: any) => {
          console.error('Error al actualizar el producto:', error);
        }
      });
    } 
    // Si es nuevo
    else {
      this.productoService.crearProductoConArchivo(formData).subscribe({
        next: (productoCreado) => {
          console.log('Producto creado con éxito:', productoCreado);
          if (productoCreado.idProducto && this.tallasSeleccionadas.length) {
            this.guardarTallasProducto(productoCreado.idProducto);
          } else {
            this.cargarProductos();
            this.cerrarModal();
          }
        },
        error: (error: any) => {
          console.error('Error al guardar el producto:', error);
        }
      });
    }
  }

  private guardarTallasProducto(idProducto: number) {
    let pendientes = this.tallasSeleccionadas.length;
    if (pendientes === 0) {
      this.cargarProductos();
      this.cerrarModal();
      return;
    }

    this.tallasSeleccionadas.forEach((tallaItem) => {
      const request = {
        idProducto,
        idTalla: tallaItem.idTalla,
        stock: tallaItem.stock
      };

      this.tallaProductoService.createTallaProducto(request).subscribe({
        next: () => {
          pendientes--;
          if (pendientes === 0) {
            this.cargarProductos();
            this.cerrarModal();
          }
        },
        error: (err: any) => {
          console.error('Error al asociar TallaProducto:', err);
          pendientes--;
          if (pendientes === 0) {
            this.cargarProductos();
            this.cerrarModal();
          }
        }
      });
    });
  }

  // ============ AGREGAR / ELIMINAR TALLA ============
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

  // ============ MODAL ============
  abrirModal() {
    this.modalAbierto = true;
    this.producto = this.nuevoProducto();
    this.tallasSeleccionadas = [];
    this.subcategoriasFiltradas = [];

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
  }

  manejarFoto(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.archivoSeleccionado = archivo;
    }
  }

  private nuevoProducto(): Producto {
    return {
      idProducto: 0,
      codigoBarra: '',
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
      sizes: []
    };
  }

  editarProducto(prod: Producto) {
    this.producto = {...prod};
    this.modalAbierto = true;
    
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
    this.codigoBarrasData = {
      codigoProducto: prod.codigoBarra || '',
      tallaSeleccionada: '',
      fila: 1,
      columna: 1
    };
    this.modalCodigoBarrasAbierto = true;
  }

  generarPDFCodigoBarras() {
    if (!this.productoParaCodigo) return;

    const doc = new jsPDF();
    
    doc.setFontSize(12);
    doc.text(`Código de Barras - ${this.productoParaCodigo.nombre}`, 10, 10);
    doc.text(`Producto: ${this.productoParaCodigo.nombre}`, 10, 20);
    doc.text(`Código: ${this.codigoBarrasData.codigoProducto}`, 10, 30);
    
    if (this.codigoBarrasData.tallaSeleccionada) {
      doc.text(`Talla: ${this.codigoBarrasData.tallaSeleccionada}`, 10, 40);
    }
    
    doc.text('CÓDIGO DE BARRAS AQUÍ', 50, 60);
    doc.text(`Configuración: Fila ${this.codigoBarrasData.fila}, Columna ${this.codigoBarrasData.columna}`, 10, 80);
    
    doc.save(`codigo_barras_${this.productoParaCodigo.nombre}.pdf`);
    this.cerrarModalCodigoBarras();
  }

  cerrarModalCodigoBarras() {
    this.modalCodigoBarrasAbierto = false;
    this.productoParaCodigo = null;
    this.codigoBarrasData = {
      codigoProducto: '',
      tallaSeleccionada: '',
      fila: 1,
      columna: 1
    };
  }

  eliminarProducto(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }
    if (!confirm('¿Deseas eliminar el producto \"' + prod.nombre + '\"?')) {
      return;
    }

    this.productoService.deleteProducto(prod.idProducto)
      .subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.idProducto !== prod.idProducto);
          this.aplicarFiltro();
          alert('Producto eliminado con éxito');
        },
        error: (err: any) => {
          console.error('Error al eliminar producto:', err);
          alert('Ocurrió un error al eliminar el producto.');
        }
      });
  }
}