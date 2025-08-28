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
  ventasChart: any;
  comprasChart: any;
  ventasMensualesChart: any;
  topProductosChart: any;
  proveedoresChart: any;
  
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

  private destroyCharts() {
    const charts = [this.ventasChart, this.comprasChart, this.ventasMensualesChart, this.topProductosChart, this.proveedoresChart];
    charts.forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;
    this.destroyCharts();
    
    this.dataSubscription = this.dashboardService.getResumenDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
        this.loadVentasPorMes();
        
        if (this.chartsReady) {
          setTimeout(() => this.createAllCharts(), 0);
        }
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Error al cargar los datos del dashboard. Verifica tu conexión.';
        this.loading = false;
      }
    });
  }

  private createAllCharts() {
    this.createVentasChart();
    this.createComprasChart();
    if (this.ventasMensuales.length > 0) {
      this.createVentasMensualesChart();
    }
  }

  createVentasChart() {
    const ctx = this.getCanvasContext('ventasChart');
    if (!ctx) return;
    
    try {
      this.ventasChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Ventas del Mes'],
          datasets: [{
            label: 'Ventas',
            data: [this.dashboardData.totalVentas || 0],
            backgroundColor: '#0097a7',
            borderRadius: 6,
            barPercentage: 0.6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { display: false },
              ticks: {
                callback: (value) => `S/ ${this.formatCurrency(Number(value))}`
              }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating ventas chart:', error);
    }
  }

  createComprasChart() {
    const ctx = this.getCanvasContext('comprasChart');
    if (!ctx) return;
    
    try {
      this.comprasChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Compras del Mes'],
          datasets: [{
            label: 'Compras',
            data: [this.dashboardData.totalCompras || 0],
            backgroundColor: '#f4c22b',
            borderRadius: 6,
            barPercentage: 0.6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { display: false },
              ticks: {
                callback: (value) => `S/ ${this.formatCurrency(Number(value))}`
              }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating compras chart:', error);
    }
  }

  loadVentasPorMes() {
    this.dashboardService.getVentasPorMes(6).subscribe({
      next: (ventasPorMes) => {
        this.ventasMensuales = ventasPorMes;
        if (this.chartsReady) {
          setTimeout(() => this.createVentasMensualesChart(), 0);
        }
      },
      error: (error) => {
        console.error('Error loading monthly sales data:', error);
      }
    });
  }

  createVentasMensualesChart() {
    const ctx = this.getCanvasContext('ventasMensualesChart');
    if (!ctx || this.ventasMensuales.length === 0) return;
    
    try {
      const meses = this.ventasMensuales.map(v => this.getNombreMes(v.mes));
      const ventas = this.ventasMensuales.map(v => v.totalVentas);
      
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
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.1)' },
              ticks: {
                callback: (value) => `S/ ${this.formatCurrency(Number(value))}`
              }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating ventas mensuales chart:', error);
    }
  }

  loadAdditionalData() {
    // Cargar top productos
    this.dashboardService.getTopProductos(5).subscribe({
      next: (productos) => {
        this.topProductos = productos;
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
        this.statsProveedores = proveedores;
        this.createProveedoresChart();
      },
      error: (error) => {
        console.error('Error loading provider stats:', error);
      }
    });

    // Cargar resumen financiero detallado
    this.dashboardService.getResumenMensualDetallado(fechaInicio, fechaFin).subscribe({
      next: (resumen) => {
        this.resumenFinanciero = resumen;
      },
      error: (error) => {
        console.error('Error loading financial summary:', error);
      }
    });
  }

  createTopProductosChart() {
    const ctx = this.getCanvasContext('topProductosChart');
    if (!ctx || this.topProductos.length === 0) return;
    
    const labels = this.topProductos.map(p => p.nombreProducto);
    const data = this.topProductos.map(p => p.totalVentas);
    
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
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `S/ ${this.formatCurrency(Number(value))}`
            }
          }
        }
      }
    });
  }

  createProveedoresChart() {
    const ctx = this.getCanvasContext('proveedoresChart');
    if (!ctx || this.statsProveedores.length === 0) return;
    
    const labels = this.statsProveedores.map(p => p.nombreProveedor);
    const data = this.statsProveedores.map(p => p.totalCompras);
    
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
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  toggleAdditionalCharts() {
    this.showAdditionalCharts = !this.showAdditionalCharts;
    if (this.showAdditionalCharts) {
      setTimeout(() => this.loadAdditionalData(), 0);
    }
  }

  private getCanvasContext(canvasId: string): CanvasRenderingContext2D | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error(`Canvas element with id '${canvasId}' not found`);
      return null;
    }
    return canvas.getContext('2d');
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