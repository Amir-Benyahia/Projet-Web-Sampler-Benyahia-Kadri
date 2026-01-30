import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Preset, Sample } from '../models/preset.model';
import { environment } from '../../environments/environment';

/**
 * Service pour gérer les presets via l'API backend
 */
@Injectable({
  providedIn: 'root'
})
export class PresetService {
  private apiUrl = environment.apiUrl + '/presets';

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les presets disponibles
   */
  getAllPresets(): Observable<Preset[]> {
    return this.http.get<Preset[]>(this.apiUrl);
  }

  /**
   * Crée un nouveau preset
   */
  createPreset(preset: Partial<Preset>): Observable<Preset> {
    return this.http.post<Preset>(this.apiUrl, preset);
  }

  /**
   * Met à jour un preset
   */
  updatePreset(id: string, preset: Partial<Preset>): Observable<Preset> {
    return this.http.put<Preset>(`${this.apiUrl}/${id}`, preset);
  }

  /**
   * Supprime un preset
   */
  deletePreset(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Ajoute un sample audio à un preset existant
   */
  addSampleToPreset(presetId: string, audioFile: File, sampleName: string, padIndex?: number): Observable<any> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('sampleName', sampleName);
    if (padIndex !== undefined) {
      formData.append('padIndex', padIndex.toString());
    }
    
    return this.http.post(`${this.apiUrl}/${presetId}/samples`, formData);
  }

  /**
   * Crée un nouveau preset avec un premier sample
   */
  createPresetWithSample(
    audioFile: File,
    presetName: string,
    type: string,
    category: string,
    sampleName: string,
    padIndex?: number
  ): Observable<any> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('name', presetName);
    formData.append('type', type);
    formData.append('category', category);
    formData.append('sampleName', sampleName);
    if (padIndex !== undefined) {
      formData.append('padIndex', padIndex.toString());
    }
    
    return this.http.post(`${this.apiUrl}/create-with-sample`, formData);
  }
}
