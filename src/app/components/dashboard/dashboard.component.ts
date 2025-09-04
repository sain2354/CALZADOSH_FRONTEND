// src/app/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { DashboardService, DashboardResumen, VentaPorMes, TopProducto, ProveedorStats, ResumenFinancieroMensual } from '../../services/dashboard.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  ventasChart: any = null;
  comprasChart: any = null;
  ventasMensualesChart: any = null;
  topProductosChart: any = null;
  proveedoresChart: any = null;
  
  dashboardData: DashboardResumen = {
    totalProductos: 0,
    totalVentas: 0,
    totalCompras: 0,
    totalGanancias: 0,
    fechaInicio: '',
    fechaFin: ''
  };
  
  ventasMensuales: VentaPorMes[] = [];
  topProductos: TopProducto[] = [];
  statsProveedores: ProveedorStats[] = [];
  resumenFinanciero: ResumenFinancieroMensual[] = [];
  
  private dataSubscription: Subscription | undefined;
  loading = true;
  error: string | null = null;
  chartsReady = false;
  showAdditionalCharts = false;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.destroyCharts();
  }

  ngAfterViewInit() {
    this.chartsReady = true;
    this.cdr.detectChanges();
    
    if (!this.loading && !this.error) {
      setTimeout(() => this.createAllCharts(), 0);
    }
  }

  // -----------------------
  // Helper: destruir charts
  // -----------------------
  private destroyCharts() {
    const charts = [
      { instance: this.ventasChart, setter: (v: any) => this.ventasChart = v },
      { instance: this.comprasChart, setter: (v: any) => this.comprasChart = v },
      { instance: this.ventasMensualesChart, setter: (v: any) => this.ventasMensualesChart = v },
      { instance: this.topProductosChart, setter: (v: any) => this.topProductosChart = v },
      { instance: this.proveedoresChart, setter: (v: any) => this.proveedoresChart = v }
    ];

    charts.forEach(item => {
      try {
        if (item.instance) {
          item.instance.destroy();
          item.setter(null);
        }
      } catch (err) {
        console.warn('Error al destruir un chart (ignorado):', err);
      }
    });
  }

  // -------------------------------------------------------
  // Helper: obtener contexto del canvas (silencioso por defecto)
  // -------------------------------------------------------
  private getCanvasContext(canvasId: string, verbose = false): CanvasRenderingContext2D | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      if (verbose) console.error(`Canvas element with id '${canvasId}' not found`);
      return null;
    }
    return canvas.getContext('2d');
  }

  // -------------------------------------------------------
  // Helper: esperar/reintentar hasta que exista el canvas
  // -------------------------------------------------------
  private waitForCanvasContext(canvasId: string, retries = 10, intervalMs = 100): Promise<CanvasRenderingContext2D | null> {
    return new Promise(resolve => {
      let attempts = 0;
      const tryGet = () => {
        const ctx = this.getCanvasContext(canvasId, false);
        if (ctx) return resolve(ctx);
        attempts++;
        if (attempts >= retries) {
          const finalCtx = this.getCanvasContext(canvasId, true);
          return resolve(finalCtx);
        }
        setTimeout(tryGet, intervalMs);
      };
      tryGet();
    });
  }

  // -------------------------------------------------------
  // Helper: parseo seguro de números (quita símbolos y comas)
  // -------------------------------------------------------
  private toNumber(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number' && !isNaN(value)) return value;
    const cleaned = String(value).replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // -------------------------------------------------------
  // Helper: recalcula ganancias netas si backend no las da
  // -------------------------------------------------------
  private recalculateGananciasIfNeeded() {
    const ventas = this.toNumber(this.dashboardData.totalVentas);
    const compras = this.toNumber(this.dashboardData.totalCompras);
    // sólo recalcular si backend no envió un valor distinto de 0
    if (!this.dashboardData.totalGanancias || this.dashboardData.totalGanancias === 0) {
      this.dashboardData.totalGanancias = ventas - compras;
      console.log('Ganancias netas recalculadas:', this.dashboardData.totalGanancias);
      // forzamos render para que la tarjeta y cualquier otro binding se actualicen
      this.cdr.detectChanges();
    }
  }

  // ----------------------
  // Carga inicial de datos
  // ----------------------
  loadDashboardData() {
    this.loading = true;
    this.error = null;
    this.destroyCharts();
    
    this.dataSubscription = this.dashboardService.getResumenDashboard().subscribe({
      next: (data) => {
        console.log('Resumen dashboard (API):', data);
        // Normalizamos por si viene string o con símbolos
        this.dashboardData.totalProductos = this.toNumber((data as any).totalProductos);
        this.dashboardData.totalVentas = this.toNumber((data as any).totalVentas);
        this.dashboardData.totalCompras = this.toNumber((data as any).totalCompras);
        this.dashboardData.totalGanancias = this.toNumber((data as any).totalGanancias);
        this.dashboardData.fechaInicio = (data as any).fechaInicio ?? '';
        this.dashboardData.fechaFin = (data as any).fechaFin ?? '';

        this.loading = false;

        // Forzamos detección para que los canvases se hayan renderizado si es necesario
        this.cdr.detectChanges();

        // Si backend no dio ganancias, intentamos calcular de inmediato (ventas - compras)
        this.recalculateGananciasIfNeeded();

        // Intentamos crear los charts principales inmediatamente si el DOM está listo
        if (this.chartsReady) {
          setTimeout(() => {
            this.createVentasChart();
            this.createComprasChart();
          }, 0);
        }

        // Cargamos ventas por mes (asíncrono)
        this.loadVentasPorMes();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Error al cargar los datos del dashboard. Verifica tu conexión.';
        this.loading = false;
      }
    });
  }

  // -------------------------------------------------
  // Crear todos los charts (se llama desde distintos lugares)
  // -------------------------------------------------
  private async createAllCharts() {
    this.createVentasChart();
    this.createComprasChart();
    if (this.ventasMensuales.length > 0) {
      this.createVentasMensualesChart();
    }
  }

  // -------------------------
  // Charts principales
  // -------------------------
  async createVentasChart() {
    const ctx = await this.waitForCanvasContext('ventasChart');
    if (!ctx) return;
    
    try {
      if (this.ventasChart) {
        this.ventasChart.destroy();
        this.ventasChart = null;
      }

      this.ventasChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Ventas del Mes'],
          datasets: [{
            label: 'Ventas',
            data: [this.toNumber(this.dashboardData.totalVentas)],
            backgroundColor: '#0097a7',
            borderRadius: 6,
            barPercentage: 0.6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { display: false },
              ticks: { callback: (value) => `S/ ${this.formatCurrency(Number(value))}` }
            },
            x: { grid: { display: false } }
          }
        }
      });
    } catch (error) {
      console.error('Error creating ventas chart:', error);
    }
  }

  async createComprasChart() {
    const ctx = await this.waitForCanvasContext('comprasChart');
    if (!ctx) {
      console.warn('createComprasChart: no ctx (canvas missing)');
      return;
    }

    const totalComprasForChart = this.toNumber(this.dashboardData.totalCompras);
    console.log('createComprasChart: totalComprasForChart=', totalComprasForChart);

    try {
      if (this.comprasChart) {
        this.comprasChart.destroy();
        this.comprasChart = null;
      }

      this.comprasChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Compras del Mes'],
          datasets: [{
            label: 'Compras',
            data: [totalComprasForChart],
            backgroundColor: '#f4c22b',
            borderRadius: 6,
            barPercentage: 0.6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { display: false },
              ticks: { callback: (value) => `S/ ${this.formatCurrency(Number(value))}` }
            },
            x: { grid: { display: false } }
          }
        }
      });

      console.log('createComprasChart: chart created (comprasChart id):', this.comprasChart?.id);
    } catch (error) {
      console.error('Error creating compras chart:', error);
    }
  }

  // -------------------------
  // Ventas mensuales (línea)
  // -------------------------
  async createVentasMensualesChart() {
    if (this.ventasMensuales.length === 0) return;
    const ctx = await this.waitForCanvasContext('ventasMensualesChart');
    if (!ctx) return;

    try {
      if (this.ventasMensualesChart) {
        this.ventasMensualesChart.destroy();
        this.ventasMensualesChart = null;
      }

      const meses = this.ventasMensuales.map(v => this.getNombreMes(v.mes));
      const ventas = this.ventasMensuales.map(v => this.toNumber((v as any).totalVentas));
      
      this.ventasMensualesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: meses,
          datasets: [{
            label: 'Ventas Mensuales',
            data: ventas,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#27ae60',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.1)' },
              ticks: { callback: (value) => `S/ ${this.formatCurrency(Number(value))}` }
            },
            x: { grid: { display: false } }
          }
        }
      });
    } catch (error) {
      console.error('Error creating ventas mensuales chart:', error);
    }
  }

  // -------------------------
  // Cargar ventas por mes  (corregido y ahora actualiza totales si es necesario)
  // -------------------------
  loadVentasPorMes() {
    this.dashboardService.getVentasPorMes(6).subscribe({
      next: (ventasPorMes) => {
        console.log('Ventas por mes (API):', ventasPorMes);

        // Normalizamos cada item para cumplir con VentaPorMes (tolerante a distintos nombres)
        this.ventasMensuales = (ventasPorMes || []).map((v: any) => {
          const mesNum = Number(v.mes ?? v.Mes ?? 0);
          const añoNum = Number(v.año ?? v.anio ?? v.year ?? new Date().getFullYear());
          const cantidad = Number(v.cantidadVentas ?? v.cantidad ?? v.count ?? 0);
          const total = this.toNumber(v.totalVentas ?? v.total ?? v.Total ?? 0);

          const normalized: VentaPorMes = {
            mes: mesNum,
            año: añoNum,
            cantidadVentas: cantidad,
            totalVentas: total
          } as VentaPorMes;

          return normalized;
        });

        // Si el backend nos dio totalVentas = 0, recalculamos el total desde ventasMensuales
        const sumaVentasMensuales = this.ventasMensuales.reduce((acc, item) => acc + this.toNumber(item.totalVentas), 0);
        if (!this.dashboardData.totalVentas || this.dashboardData.totalVentas === 0) {
          this.dashboardData.totalVentas = sumaVentasMensuales;
        }

        // Forzamos detección ya que cambiamos valores que se muestran en el template
        this.cdr.detectChanges();

        // Recalcular ganancias si hace falta (ventas pudo haber cambiado)
        this.recalculateGananciasIfNeeded();

        // Creamos/actualizamos los charts dependientes
        if (this.chartsReady) {
          setTimeout(() => {
            this.createVentasMensualesChart();
            // actualizamos también la barra de ventas (refresca la tarjeta y el chart)
            this.createVentasChart();
          }, 0);
        }
      },
      error: (error) => {
        console.error('Error loading monthly sales data:', error);
      }
    });
  }

  // -------------------------
  // Datos adicionales (top productos / proveedores)
  // -------------------------
  loadAdditionalData() {
    // Cargar top productos
    this.dashboardService.getTopProductos(5).subscribe({
      next: (productos) => {
        console.log('Top productos (API):', productos);
        this.topProductos = (productos || []).map((p: any) => ({
          ...p,
          totalVentas: this.toNumber((p as any).totalVentas)
        }));
        this.createTopProductosChart();
      },
      error: (error) => {
        console.error('Error loading top products:', error);
      }
    });

    // Cargar estadísticas de proveedores
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 6);
    
    this.dashboardService.getEstadisticasProveedores(fechaInicio, fechaFin).subscribe({
      next: (proveedores) => {
        console.log('Estadísticas proveedores (API raw):', proveedores);

        // Mapeo tolerante: aceptamos varios nombres posibles para el total de compras
        const mapped = (proveedores || []).map((p: any) => {
          const rawTotal = p.totalCompras ?? p.total ?? p.Total ?? p.monto ?? p.importe ?? p.total_amount ?? p.totalCompra;
          return {
            ...p,
            totalCompras: this.toNumber(rawTotal)
          };
        });

        this.statsProveedores = mapped as ProveedorStats[];
        console.log('Estadísticas proveedores (mapped):', this.statsProveedores);

        // Crear gráfico de proveedores (pie) si corresponde
        this.createProveedoresChart();

        // ---------- recalcular totalCompras desde statsProveedores si backend da 0 ----------
        const sumaCompras = (this.statsProveedores || []).reduce((acc: number, p: any) => acc + this.toNumber(p.totalCompras), 0);
        console.log('Suma compras calculada desde statsProveedores:', sumaCompras);

        if ((!this.dashboardData.totalCompras || this.dashboardData.totalCompras === 0) && sumaCompras > 0) {
          this.dashboardData.totalCompras = sumaCompras;
          // Forzamos render y actualizamos el chart de compras
          this.cdr.detectChanges();
          // Recalcular ganancias ahora que compras cambió
          this.recalculateGananciasIfNeeded();
          if (this.chartsReady) {
            setTimeout(() => this.createComprasChart(), 0);
          }
        } else {
          // Si el dashboardData tiene valor >0 ya, forzamos creación del chart para reflejarlo
          if (this.dashboardData.totalCompras && this.dashboardData.totalCompras > 0 && this.chartsReady) {
            console.log('dashboardData.totalCompras ya tiene valor:', this.dashboardData.totalCompras, '-> recreando chart');
            setTimeout(() => this.createComprasChart(), 0);
          }
        }
        // ---------------------------------------------------------------------------------------
      },
      error: (error) => {
        console.error('Error loading provider stats:', error);
      }
    });

    // Cargar resumen financiero detallado
    this.dashboardService.getResumenMensualDetallado(fechaInicio, fechaFin).subscribe({
      next: (resumen) => {
        console.log('Resumen financiero (API):', resumen);
        this.resumenFinanciero = (resumen || []).map((r: any) => ({
          ...r,
          total: this.toNumber((r as any).total)
        }));

        // ---------- fallback -> si aún no tenemos totalCompras, intentar sumar desde resumenFinanciero ----------
        const sumaDesdeResumen = (this.resumenFinanciero || [])
          .filter((r: any) => String(r.tipo ?? '').toLowerCase().includes('compra'))
          .reduce((acc: number, r: any) => acc + this.toNumber(r.total), 0);
        console.log('Suma compras calculada desde resumenFinanciero (filtro "compra"):', sumaDesdeResumen);
        if ((!this.dashboardData.totalCompras || this.dashboardData.totalCompras === 0) && sumaDesdeResumen > 0) {
          this.dashboardData.totalCompras = sumaDesdeResumen;
          this.cdr.detectChanges();
          // Recalcular ganancias ahora que compras cambió
          this.recalculateGananciasIfNeeded();
          if (this.chartsReady) {
            setTimeout(() => this.createComprasChart(), 0);
          }
        } else {
          // si dashboardData ya tenía totalCompras > 0 asegúrate que el chart esté creado
          if (this.dashboardData.totalCompras && this.dashboardData.totalCompras > 0 && this.chartsReady) {
            setTimeout(() => this.createComprasChart(), 0);
          }
        }
        // ---------------------------------------------------------------------------------------
      },
      error: (error) => {
        console.error('Error loading financial summary:', error);
      }
    });
  }

  // -------------------------
  // Top productos
  // -------------------------
  async createTopProductosChart() {
    if (this.topProductos.length === 0) return;
    const ctx = await this.waitForCanvasContext('topProductosChart');
    if (!ctx) return;

    try {
      if (this.topProductosChart) {
        this.topProductosChart.destroy();
        this.topProductosChart = null;
      }

      const labels = this.topProductos.map(p => p.nombreProducto);
      const data = this.topProductos.map(p => this.toNumber(p.totalVentas));
      
      this.topProductosChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ventas por Producto',
            data: data,
            backgroundColor: '#3498db',
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (value) => `S/ ${this.formatCurrency(Number(value))}` }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating top productos chart:', error);
    }
  }

  // -------------------------
  // Proveedores (pie)
  // -------------------------
  async createProveedoresChart() {
    if (this.statsProveedores.length === 0) return;
    const ctx = await this.waitForCanvasContext('proveedoresChart');
    if (!ctx) return;

    try {
      if (this.proveedoresChart) {
        this.proveedoresChart.destroy();
        this.proveedoresChart = null;
      }

      const labels = this.statsProveedores.map(p => p.nombreProveedor);
      const data = this.statsProveedores.map(p => this.toNumber(p.totalCompras));
      
      this.proveedoresChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Compras por Proveedor',
            data: data,
            backgroundColor: [
              '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
              '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
            ],
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
      console.log('createProveedoresChart: created pie with data:', data);
    } catch (error) {
      console.error('Error creating proveedores chart:', error);
    }
  }

  toggleAdditionalCharts() {
    this.showAdditionalCharts = !this.showAdditionalCharts;
    if (this.showAdditionalCharts) {
      setTimeout(() => this.loadAdditionalData(), 100);
    } else {
      if (this.topProductosChart) { this.topProductosChart.destroy(); this.topProductosChart = null; }
      if (this.proveedoresChart) { this.proveedoresChart.destroy(); this.proveedoresChart = null; }
    }
  }

  getNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || `Mes ${mes}`;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-PE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }

  refreshData() {
    this.loadDashboardData();
    if (this.showAdditionalCharts) {
      this.loadAdditionalData();
    }
  }
}
