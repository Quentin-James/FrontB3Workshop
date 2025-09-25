import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HTTPAuthBack } from './auth.backend';

interface Mesure {
  id: number;
  sensorsId: number;
  authentificationId: number;
  valeur: number;
  dateMesure: string;
}

@Injectable({
  providedIn: 'root'
})
export class MesureService{
    private readonly httpClient = inject(HTTPAuthBack);
    

    getAllMesures(): Observable<Mesure[]> {
    return this.httpClient.get<Mesure[]>('api/Mesure');
  }

    getMesuresBySensor(sensorId: number): Observable<Mesure[]> {
    return this.httpClient.get<Mesure[]>(`api/Mesure/${sensorId}`);
  }



}