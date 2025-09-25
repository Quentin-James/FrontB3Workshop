import { Component, OnInit, OnDestroy, signal, computed, viewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { interval, Subject, takeUntil, switchMap, catchError, of } from 'rxjs';
import { MesureService } from '../Services/mesure.backend';

/**
 * Interface représentant une mesure selon le schéma BDD
 */
interface Mesure {
  id: number;
  sensorsId: number;  
  authentificationId: number;
  valeur: number;
  dateMesure: string;
}

/**
 * Statistiques calculées pour un ensemble de mesures
 */
interface MesureStats {
  avg: number;
  min: number;
  max: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseChartDirective]
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly mesureService = inject(MesureService);
  private readonly destroy$ = new Subject<void>();

  // ViewChild avec la nouvelle syntaxe
  tempChart = viewChild<BaseChartDirective>('tempChart');
  humChart = viewChild<BaseChartDirective>('humChart');
  gasChart = viewChild<BaseChartDirective>('gasChart');
  lightChart = viewChild<BaseChartDirective>('lightChart');
  waterChart = viewChild<BaseChartDirective>('waterChart');

  // Signaux pour l'état de l'application
  connected = signal(true);
  lastUpdate = signal(new Date());
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Signaux pour les données des capteurs
  private readonly mesures = signal<Mesure[]>([]);
  
  // Computed pour séparer les mesures par type de capteur
  temperatureMesures = computed(() => 
    this.mesures().filter(m => m.sensorsId === 1 || m.sensorsId === 6) // Capteurs de température (1 et 6)
  );
  
  humidityMesures = computed(() => 
    this.mesures().filter(m => m.sensorsId === 2) // Capteur d'humidité (2)
  );
  
  gasMesures = computed(() => 
    this.mesures().filter(m => m.sensorsId === 3) // Capteur de gaz (3)
  );
  
  lightMesures = computed(() => 
    this.mesures().filter(m => m.sensorsId === 4) // Capteur de lumière (4)
  );
  
  waterMesures = computed(() => 
    this.mesures().filter(m => m.sensorsId === 5) // Capteur d'eau (5)
  );

  // Valeurs actuelles (dernière mesure de chaque capteur)
  temperature = computed(() => {
    const tempMesures = this.temperatureMesures();
    return tempMesures.length > 0 ? tempMesures[tempMesures.length - 1].valeur : 0;
  });

  humidity = computed(() => {
    const humMesures = this.humidityMesures();
    return humMesures.length > 0 ? humMesures[humMesures.length - 1].valeur : 0;
  });

  gas = computed(() => {
    const gasMesures = this.gasMesures();
    return gasMesures.length > 0 ? gasMesures[gasMesures.length - 1].valeur : 0;
  });

  light = computed(() => {
    const lightMesures = this.lightMesures();
    return lightMesures.length > 0 ? lightMesures[lightMesures.length - 1].valeur : 0;
  });

  water = computed(() => {
    const waterMesures = this.waterMesures();
    return waterMesures.length > 0 ? waterMesures[waterMesures.length - 1].valeur : 0;
  });

  // Données pour les graphiques
  tempData = computed(() => this.temperatureMesures().map(m => m.valeur));
  humData = computed(() => this.humidityMesures().map(m => m.valeur));
  gasData = computed(() => this.gasMesures().map(m => m.valeur));
  lightData = computed(() => this.lightMesures().map(m => m.valeur));
  waterData = computed(() => this.waterMesures().map(m => m.valeur));
  
  timeLabels = computed(() => {
    const allMesures = this.mesures().sort((a, b) => new Date(a.dateMesure).getTime() - new Date(b.dateMesure).getTime());
    return allMesures.slice(-20).map(m => new Date(m.dateMesure).toLocaleTimeString());
  });

  // Statistiques calculées
  tempStats = computed((): MesureStats => this.calculateStats(this.tempData()));
  humStats = computed((): MesureStats => this.calculateStats(this.humData()));
  gasStats = computed((): MesureStats => this.calculateStats(this.gasData()));
  lightStats = computed((): MesureStats => this.calculateStats(this.lightData()));
  waterStats = computed((): MesureStats => this.calculateStats(this.waterData()));

  // Configuration des graphiques
  tempChartData = computed((): ChartConfiguration<'line'>['data'] => ({
    labels: this.temperatureMesures().map(m => new Date(m.dateMesure).toLocaleTimeString()),
    datasets: [{
      label: 'Température (°C)',
      data: this.tempData(),
      fill: false,
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      pointRadius: 4,
      tension: 0.3,
      showLine: true
    }]
  }));

  humChartData = computed((): ChartConfiguration<'line'>['data'] => ({
    labels: this.humidityMesures().map(m => new Date(m.dateMesure).toLocaleTimeString()),
    datasets: [{
      label: 'Humidité (%)',
      data: this.humData(),
      fill: false,
      borderColor: '#10b981',
      backgroundColor: '#10b981',
      pointRadius: 4,
      tension: 0.3,
      showLine: true
    }]
  }));

  tempChartOptions = computed((): ChartOptions<'line'> => {
    const stats = this.tempStats();
    return {
      ...this.baseChartOptions,
      scales: {
        x: { type: 'category', title: { display: true, text: 'Time' } },
        y: { 
          beginAtZero: false, 
          suggestedMin: stats.min * 0.9, 
          suggestedMax: stats.max * 1.1, 
          title: { display: true, text: 'Temp (°C)' } 
        }
      },
      animation: { duration: 500, easing: 'linear' }
    };
  });

  humChartOptions = computed((): ChartOptions<'line'> => {
    const stats = this.humStats();
    return {
      ...this.baseChartOptions,
      scales: {
        x: { type: 'category', title: { display: true, text: 'Time' } },
        y: { 
          beginAtZero: false, 
          suggestedMin: stats.min * 0.9, 
          suggestedMax: stats.max * 1.1, 
          title: { display: true, text: 'Humidité (%)' } 
        }
      },
      animation: { duration: 500, easing: 'linear' }
    };
  });

  gasChartData = computed((): ChartConfiguration<'line'>['data'] => ({
    labels: this.gasMesures().map(m => new Date(m.dateMesure).toLocaleTimeString()),
    datasets: [{
      label: 'Gaz (boolean)',
      data: this.gasData(),
      fill: false,
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b',
      pointRadius: 4,
      tension: 0.3,
      showLine: true
    }]
  }));

  gasChartOptions = computed((): ChartOptions<'line'> => ({
    ...this.baseChartOptions,
    scales: {
      x: { type: 'category', title: { display: true, text: 'Time' } },
      y: { 
        beginAtZero: true, 
        suggestedMax: 1.2, 
        title: { display: true, text: 'Gaz (0/1)' } 
      }
    },
    animation: { duration: 500, easing: 'linear' }
  }));

  lightChartData = computed((): ChartConfiguration<'line'>['data'] => ({
    labels: this.lightMesures().map(m => new Date(m.dateMesure).toLocaleTimeString()),
    datasets: [{
      label: 'Lumière (boolean)',
      data: this.lightData(),
      fill: false,
      borderColor: '#eab308',
      backgroundColor: '#eab308',
      pointRadius: 4,
      tension: 0.3,
      showLine: true
    }]
  }));

  lightChartOptions = computed((): ChartOptions<'line'> => ({
    ...this.baseChartOptions,
    scales: {
      x: { type: 'category', title: { display: true, text: 'Time' } },
      y: { 
        beginAtZero: true, 
        suggestedMax: 1.2, 
        title: { display: true, text: 'Lumière (0/1)' } 
      }
    },
    animation: { duration: 500, easing: 'linear' }
  }));

  waterChartData = computed((): ChartConfiguration<'line'>['data'] => ({
    labels: this.waterMesures().map(m => new Date(m.dateMesure).toLocaleTimeString()),
    datasets: [{
      label: 'Eau (boolean)',
      data: this.waterData(),
      fill: false,
      borderColor: '#06b6d4',
      backgroundColor: '#06b6d4',
      pointRadius: 4,
      tension: 0.3,
      showLine: true
    }]
  }));

  waterChartOptions = computed((): ChartOptions<'line'> => ({
    ...this.baseChartOptions,
    scales: {
      x: { type: 'category', title: { display: true, text: 'Time' } },
      y: { 
        beginAtZero: true, 
        suggestedMax: 1.2, 
        title: { display: true, text: 'Eau (0/1)' } 
      }
    },
    animation: { duration: 500, easing: 'linear' }
  }));

  readonly baseChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { type: 'category', title: { display: true, text: 'Time' } },
      y: { beginAtZero: false, title: { display: true, text: 'Value' } }
    }
  };

  ngOnInit(): void {
    this.initializeDataFetching();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise la récupération périodique des données depuis l'API
   */
  private initializeDataFetching(): void {
    // Chargement initial
    this.loadMesures();

    // Mise à jour automatique toutes les 5 secondes
    interval(5000)
      .pipe(
        switchMap(() => this.getMesuresObservable()),
        takeUntil(this.destroy$)
      )
      .subscribe(mesures => {
        this.updateMesures(mesures);
        this.isLoading.set(false);
        this.connected.set(true);
        this.lastUpdate.set(new Date());
      });
  }

  /**
   * Retourne l'Observable des mesures pour les mises à jour automatiques
   */
  private getMesuresObservable() {
    return this.mesureService.getAllMesures()
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des mesures:', error);
          this.error.set('Erreur de connexion à l\'API');
          this.connected.set(false);
          return of([]);
        })
      );
  }

  /**
   * Charge les mesures depuis l'API
   */
  private loadMesures() {
    console.log('🚀 Chargement des mesures depuis l\'API...');
    this.isLoading.set(true);
    this.error.set(null);

    this.getMesuresObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mesures) => {
          console.log('✅ Mesures chargées avec succès:', mesures);
          this.updateMesures(mesures);
          this.isLoading.set(false);
          this.connected.set(true);
          this.lastUpdate.set(new Date());
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement:', error);
          this.isLoading.set(false);
          this.connected.set(false);
          this.error.set('Erreur de chargement des données');
        }
      });
  }

  /**
   * Met à jour les données des mesures
   */
  private updateMesures(mesures: Mesure[]): void {
    console.log('🔍 Données reçues de l\'API:', mesures);
    console.log('📊 Nombre total de mesures:', mesures.length);

    if (mesures.length === 0) {
      console.warn('⚠️ Aucune mesure reçue de l\'API');
      return;
    }

    // Trier par date et garder seulement les 20 dernières par capteur
    const sortedMesures = mesures.sort((a, b) => 
      new Date(b.dateMesure).getTime() - new Date(a.dateMesure).getTime()
    );

    console.log('📅 Mesures triées par date:', sortedMesures);

    // Limiter à 20 mesures par type de capteur
    const limitedMesures: Mesure[] = [];
    const sensorCounts = new Map<number, number>();

    for (const mesure of sortedMesures) {
      const count = sensorCounts.get(mesure.sensorsId) || 0;
      if (count < 20) {
        limitedMesures.push(mesure);
        sensorCounts.set(mesure.sensorsId, count + 1);
      }
    }

    console.log('🎯 Mesures limitées:', limitedMesures);
    console.log('📈 Répartition par capteur:', Array.from(sensorCounts.entries()));

    // Trier à nouveau par date croissante pour l'affichage
    const finalMesures = limitedMesures.sort((a, b) => 
      new Date(a.dateMesure).getTime() - new Date(b.dateMesure).getTime()
    );

    console.log('✅ Mesures finales à afficher:', finalMesures);
    
    this.mesures.set(finalMesures);

    // Afficher les valeurs actuelles calculées
    console.log('🌡️ Température actuelle:', this.temperature());
    console.log('💧 Humidité actuelle:', this.humidity());
    console.log('🔥 Gaz actuel:', this.gas());
    console.log('💡 Lumière actuelle:', this.light());
    console.log('💧 Eau actuelle:', this.water());

    this.updateCharts();
  }

  /**
   * Met à jour les graphiques
   */
  private updateCharts(): void {
    const tempChart = this.tempChart();
    const humChart = this.humChart();
    const gasChart = this.gasChart();
    const lightChart = this.lightChart();
    const waterChart = this.waterChart();
    
    // Accéder à l'instance Chart.js via la propriété 'chart' de BaseChartDirective
    if (tempChart?.chart) tempChart.chart.update();
    if (humChart?.chart) humChart.chart.update();
    if (gasChart?.chart) gasChart.chart.update();
    if (lightChart?.chart) lightChart.chart.update();
    if (waterChart?.chart) waterChart.chart.update();
  }

  /**
   * Calcule les statistiques pour un ensemble de valeurs
   */
  private calculateStats(data: number[]): MesureStats {
    if (data.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }

    const sum = data.reduce((a, b) => a + b, 0);
    return {
      avg: sum / data.length,
      min: Math.min(...data),
      max: Math.max(...data)
    };
  }

  /**
   * Exporte les données au format JSON
   */
  exportData(): void {
    const exportData = this.mesures().map(mesure => ({
      id: mesure.id,
      capteur: this.getSensorName(mesure.sensorsId),
      valeur: mesure.valeur,
      unite: this.getSensorUnit(mesure.sensorsId),
      date: new Date(mesure.dateMesure).toLocaleString(),
      utilisateur_id: mesure.authentificationId
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    this.downloadFile(blob, 'mesures_data.json');
  }

  /**
   * Génère un résumé quotidien
   */
  generateDailySummary(): void {
    const tempStats = this.tempStats();
    const humStats = this.humStats();
    const gasStats = this.gasStats();
    const lightStats = this.lightStats();
    const waterStats = this.waterStats();

    const summary = `
Résumé Quotidien - ${new Date().toLocaleDateString()}

Température: Moy ${tempStats.avg.toFixed(1)}°C | Min ${tempStats.min.toFixed(1)}°C | Max ${tempStats.max.toFixed(1)}°C
Humidité:    Moy ${humStats.avg.toFixed(1)}%  | Min ${humStats.min.toFixed(1)}%  | Max ${humStats.max.toFixed(1)}%
Gaz:         ${this.gas() ? 'Détecté' : 'Non détecté'} | Mesures: ${gasStats.avg.toFixed(1)}
Lumière:     ${this.light() ? 'Allumée' : 'Éteinte'} | Mesures: ${lightStats.avg.toFixed(1)}
Eau:         ${this.water() ? 'Détectée' : 'Non détectée'} | Mesures: ${waterStats.avg.toFixed(1)}

Nombre de mesures:
- Température: ${this.temperatureMesures().length}
- Humidité: ${this.humidityMesures().length}
- Gaz: ${this.gasMesures().length}
- Lumière: ${this.lightMesures().length}
- Eau: ${this.waterMesures().length}

Dernière mise à jour: ${this.lastUpdate().toLocaleString()}
`;

    const blob = new Blob([summary], { type: 'text/plain' });
    this.downloadFile(blob, `resume_quotidien_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`);
  }

  /**
   * Force la mise à jour des données
   */
  refreshData(): void {
    this.loadMesures();
  }

  /**
   * Utilitaire pour télécharger un fichier
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Retourne le nom du capteur selon son ID
   */
  private getSensorName(sensorId: number): string {
    switch (sensorId) {
      case 1: return 'Température 1';
      case 2: return 'Humidité';
      case 3: return 'Gaz';
      case 4: return 'Lumière';
      case 5: return 'Eau';
      case 6: return 'Température 2';
      default: return `Capteur ${sensorId}`;
    }
  }

  /**
   * Retourne l'unité du capteur selon son ID
   */
  private getSensorUnit(sensorId: number): string {
    switch (sensorId) {
      case 1: return '°C';
      case 2: return '%';
      case 3: return 'boolean';
      case 4: return 'boolean';
      case 5: return 'boolean';
      case 6: return '°C';
      default: return '';
    }
  }
}