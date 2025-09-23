import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  connected = true;
  lastUpdate = new Date();

  temperature = 34.3;
  humidity = 55.3;
  luminosity = 175.6;

  tempData: number[] = [];
  humData: number[] = [];
  lumData: number[] = [];
  timeLabels: string[] = [];

  @ViewChild('tempChart') tempChart?: BaseChartDirective;
  @ViewChild('humChart') humChart?: BaseChartDirective;

  tempChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  humChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

  tempChartOptions: ChartOptions<'line'> = {};
  humChartOptions: ChartOptions<'line'> = {};

  // Options de base communes
  baseChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { type: 'category', title: { display: true, text: 'Time' } },
      y: { beginAtZero: false, title: { display: true, text: 'Value' } }
    }
  };

  ngOnInit() {
    this.tempChartData.datasets = [
      {
        label: 'Température (°C)',
        data: [],
        fill: false,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        pointRadius: 4,
        tension: 0.3,
        showLine: true
      }
    ];

    this.humChartData.datasets = [
      {
        label: 'Humidité (%)',
        data: [],
        fill: false,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        pointRadius: 4,
        tension: 0.3,
        showLine: true
      }
    ];

    // Initialisation des options pour chaque graphique
    this.tempChartOptions = { ...this.baseChartOptions };
    this.humChartOptions = { ...this.baseChartOptions };

    setInterval(() => this.updateData(), 5000);
  }

  updateData() {
    const now = new Date();
    this.lastUpdate = now;

    // Simulation de nouvelles valeurs
    this.temperature = 28 + Math.random() * 10;
    this.humidity = 40 + Math.random() * 30;
    this.luminosity = 100 + Math.random() * 200;

    if (this.timeLabels.length >= 20) {
      this.timeLabels.shift();
      this.tempData.shift();
      this.humData.shift();
      this.lumData.shift();
    }

    const label = now.toLocaleTimeString();
    this.timeLabels.push(label);
    this.tempData.push(this.temperature);
    this.humData.push(this.humidity);
    this.lumData.push(this.luminosity);

    // Min/Max dynamiques par graphique
    const tempMin = Math.min(...this.tempData) * 0.9;
    const tempMax = Math.max(...this.tempData) * 1.1;
    const humMin = Math.min(...this.humData) * 0.9;
    const humMax = Math.max(...this.humData) * 1.1;

    // Mise à jour des options individuelles
    this.tempChartOptions = {
      ...this.baseChartOptions,
      scales: {
        x: { type: 'category', title: { display: true, text: 'Time' } },
        y: { beginAtZero: false, suggestedMin: tempMin, suggestedMax: tempMax, title: { display: true, text: 'Temp (°C)' } }
      }, animation: {
    duration: 500, // ms
    easing: 'linear' // glisse linéaire
  }
    };

    this.humChartOptions = {
      ...this.baseChartOptions,
      scales: {
        x: { type: 'category', title: { display: true, text: 'Time' } },
        y: { beginAtZero: false, suggestedMin: humMin, suggestedMax: humMax, title: { display: true, text: 'Humidité (%)' } }
      }, animation: {
    duration: 500, // ms
    easing: 'linear' // glisse linéaire
  }
    };

    // Mise à jour des datasets
    this.tempChartData = {
      labels: [...this.timeLabels],
      datasets: [
        {
          label: 'Température (°C)',
          data: [...this.tempData],
          fill: false,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          pointRadius: 4,
          tension: 0.3,
          showLine: true
        }
      ]
    };

    this.humChartData = {
      labels: [...this.timeLabels],
      datasets: [
        {
          label: 'Humidité (%)',
          data: [...this.humData],
          fill: false,
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          pointRadius: 4,
          tension: 0.3,
          showLine: true
        }
      ]
    };

    if (this.tempChart) this.tempChart.update();
    if (this.humChart) this.humChart.update();
  }

  // Min / Max getters
  get maxTemp() { return this.tempData.length ? Math.max(...this.tempData) : 0; }
  get minTemp() { return this.tempData.length ? Math.min(...this.tempData) : 0; }
  get maxHum() { return this.humData.length ? Math.max(...this.humData) : 0; }
  get minHum() { return this.humData.length ? Math.min(...this.humData) : 0; }
  get maxLum() { return this.lumData.length ? Math.max(...this.lumData) : 0; }
  get minLum() { return this.lumData.length ? Math.min(...this.lumData) : 0; }
}
//dfdff