import { Component, OnInit } from '@angular/core';

interface ProductoInventario {
  codigo: string;
  descripcion: string;
  ingresos: number;
  salidas: number;
  stock: number;
}

@Component({
  selector: 'app-entrada-salida',
  templateUrl: './entrada-salida.component.html',
  styleUrls: ['./entrada-salida.component.css']
})
export class EntradaSalidaComponent implements OnInit {

  productos: ProductoInventario[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  textoBusqueda: string = '';

  ngOnInit() {
    this.productos = [
      { codigo: '512202423387', descripcion: 'POLOS DE MIGUEL', ingresos: 23, salidas: 8, stock: 15 },
      { codigo: '56202517190', descripcion: 'ZAPATO DEPORTIVO', ingresos: 2, salidas: 0, stock: 2 },
      { codigo: '5620251721', descripcion: 'ZAPATO LUCHO', ingresos: 4, salidas: 1, stock: 3 },
      { codigo: '61120240632', descripcion: 'GOKU', ingresos: 262, salidas: 4, stock: 258 },
      { codigo: '611202414672', descripcion: 'PANTALON', ingresos: 41, salidas: 13, stock: 28 },
      { codigo: '65202520291', descripcion: 'JOGGER CARGO', ingresos: 140, salidas: 1, stock: 139 },
      { codigo: '6620253466', descripcion: 'CHELAS', ingresos: 2, salidas: 0, stock: 2 },
      { codigo: '770735053448', descripcion: 'JERSEY MC', ingresos: 30, salidas: 16, stock: 14 },
      { codigo: '811202420807', descripcion: 'CAMISETA BLANCA CON MANGAS CORTAS', ingresos: 155, salidas: 9, stock: 146 },
      { codigo: '811202422425', descripcion: 'NXKDNDN', ingresos: 259, salidas: 18, stock: 241 }
    ];
  }

  actualizarBusqueda(valor: string) {
    this.textoBusqueda = valor.toLowerCase();
    this.paginaActual = 1;
  }

  actualizarRegistros(valor: string) {
    this.registrosPorPagina = parseInt(valor, 10);
    this.paginaActual = 1;
  }

  get productosFiltrados() {
    return this.productos.filter(p =>
      p.descripcion.toLowerCase().includes(this.textoBusqueda) ||
      p.codigo.includes(this.textoBusqueda)
    );
  }

  get productosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.productosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
  }

  totalPaginas(): number {
    return Math.ceil(this.productosFiltrados.length / this.registrosPorPagina);
  }
}
