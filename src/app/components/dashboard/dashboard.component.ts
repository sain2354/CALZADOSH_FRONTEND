import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule     // <— esto es imprescindible
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements AfterViewInit {
  showModal = false;
  modalTitle = '';

  trafficChart: any;
  donutChart: any;
  modalChart: any;

  ngAfterViewInit() {
    this.createTrafficChart();
    this.createDonutChart();
  }

  createTrafficChart() {
    const ctx = document.getElementById('trafficChart') as HTMLCanvasElement;
    this.trafficChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Visitas',
          data: [400, 600, 800, 700, 900, 1200, 1500],
          borderColor: '#007bff',
          backgroundColor: 'rgba(0,123,255,0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#007bff'
        }]
      },
      options: {
        responsive: true,
        aspectRatio: 2.5,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            enabled: true
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Día'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Visitas'
            }
          }
        }
      }
    });
  }

  createDonutChart() {
    const ctx = document.getElementById('donutChart') as HTMLCanvasElement;
    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Producto A', 'Producto B', 'Producto C'],
        datasets: [{
          data: [40, 30, 30],
          backgroundColor: ['#007bff', '#28a745', '#f4c22b']
        }]
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  }

  verDetalle(tipo: string) {
    this.showModal = true;

    if (this.modalChart) {
      this.modalChart.destroy();
    }

    const ctx = document.getElementById('modalChart') as HTMLCanvasElement;

    if (tipo === 'traffic') {
      this.modalTitle = 'Detalle de Tráfico';
      this.modalChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          datasets: [{
            label: 'Visitas',
            data: [400, 600, 800, 700, 900, 1200, 1500],
            backgroundColor: '#007bff'
          }]
        }
      });
    } else if (tipo === 'products') {
      this.modalTitle = 'Detalle de Productos Vendidos';
      this.modalChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Producto A', 'Producto B', 'Producto C'],
          datasets: [{
            data: [40, 30, 30],
            backgroundColor: ['#007bff', '#28a745', '#f4c22b']
          }]
        }
      });
    } else if (tipo === 'server') {
      this.modalTitle = 'Detalle de Capacidad del Servidor';
      this.modalChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['CPU', 'Memoria', 'Disco'],
          datasets: [{
            label: 'Uso (%)',
            data: [30, 55, 45],
            backgroundColor: ['#007bff', '#28a745', '#f4c22b']
          }]
        }
      });
    }
  }

  cerrarModal() {
    this.showModal = false;
  }
}
