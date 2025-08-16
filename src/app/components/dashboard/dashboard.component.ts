import { Component, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements AfterViewInit {

  ventasChart: any;
  comprasChart: any;

  ngAfterViewInit() {
    this.createVentasChart();
    this.createComprasChart();
  }

  createVentasChart() {
    const ctx = document.getElementById('ventasChart') as HTMLCanvasElement;
    this.ventasChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Agosto 2025'],
        datasets: [{
          label: 'Ventas del Mes',
          data: [226715],
          backgroundColor: '#0097a7'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }

  createComprasChart() {
    const ctx = document.getElementById('comprasChart') as HTMLCanvasElement;
    this.comprasChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Agosto 2025'],
        datasets: [{
          label: 'Compras del Mes',
          data: [0],
          backgroundColor: '#f4c22b'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }
}
