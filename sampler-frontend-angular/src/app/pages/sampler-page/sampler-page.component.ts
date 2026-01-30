import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SamplerGridComponent } from '../../components/sampler-grid/sampler-grid.component';
import { PresetService } from '../../services/preset.service';
import { RecorderService } from '../../services/recorder.service';
import { AudioService } from '../../services/audio.service';
import { Preset } from '../../models/preset.model';

@Component({
  selector: 'app-sampler-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SamplerGridComponent],
  templateUrl: './sampler-page.component.html',
  styleUrls: ['./sampler-page.component.css']
})
export class SamplerPageComponent implements OnInit {
  presets: Preset[] = [];
  selectedPreset: Preset | null = null;
  isLoading = false;
  
  // Propriétés pour l'enregistrement vocal
  isRecording = false;
  recordedBlob: Blob | null = null;
  recordedBuffer: AudioBuffer | null = null;
  recordingTime = 0;
  private recordingInterval: any = null;
  showRecordingModal = false;

  constructor(
    private presetService: PresetService,
    private recorderService: RecorderService,
    private audioService: AudioService
  ) {}

  ngOnInit(): void {
    this.loadPresets();
  }

  loadPresets(): void {
    this.isLoading = true;
    this.presetService.getAllPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        this.isLoading = false;
        // Sélectionner automatiquement le premier preset
        if (presets.length > 0) {
          this.selectedPreset = presets[0];
        }
      },
      error: (err) => {
        console.error('Erreur chargement presets:', err);
        this.isLoading = false;
      }
    });
  }

  selectPreset(preset: Preset): void {
    this.selectedPreset = preset;
  }

  getSamples() {
    return this.selectedPreset?.samples || [];
  }

  // === Méthodes pour l'enregistrement vocal ===

  /**
   * Ouvre la modal d'enregistrement
   */
  openRecordingModal(): void {
    this.showRecordingModal = true;
    this.recordedBlob = null;
    this.recordedBuffer = null;
    this.recordingTime = 0;
  }

  /**
   * Ferme la modal d'enregistrement
   */
  closeRecordingModal(): void {
    this.showRecordingModal = false;
    if (this.isRecording) {
      this.cancelRecording();
    }
  }

  /**
   * Démarre l'enregistrement vocal
   */
  async startRecording(): Promise<void> {
    try {
      await this.recorderService.startRecording();
      this.isRecording = true;
      this.recordingTime = 0;
      
      // Démarrage du chronomètre
      this.recordingInterval = setInterval(() => {
        this.recordingTime++;
      }, 1000);
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  }

  /**
   * Arrête l'enregistrement vocal
   */
  async stopRecording(): Promise<void> {
    try {
      // Arrêt du chronomètre
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }

      // Récupération du Blob audio
      this.recordedBlob = await this.recorderService.stopRecording();
      this.isRecording = false;

      // Conversion du Blob en AudioBuffer pour la lecture
      await this.convertBlobToBuffer(this.recordedBlob);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
      this.isRecording = false;
    }
  }

  /**
   * Annule l'enregistrement en cours
   */
  cancelRecording(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
    this.recorderService.cancelRecording();
    this.isRecording = false;
    this.recordedBlob = null;
    this.recordedBuffer = null;
    this.recordingTime = 0;
  }

  /**
   * Convertit un Blob audio en AudioBuffer
   */
  private async convertBlobToBuffer(blob: Blob): Promise<void> {
    try {
      this.audioService.initAudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      this.recordedBuffer = await this.audioService.decodeArrayBuffer(arrayBuffer);
    } catch (error) {
      console.error('Erreur lors de la conversion du Blob:', error);
      throw error;
    }
  }

  /**
   * Joue l'enregistrement vocal
   */
  playRecording(): void {
    if (this.recordedBuffer) {
      this.audioService.playBuffer(this.recordedBuffer);
    }
  }

  /**
   * Ajoute l'enregistrement au preset actuel
   */
  async addRecordingToPreset(): Promise<void> {
    if (!this.recordedBlob || !this.selectedPreset) {
      alert('Aucun enregistrement ou preset selectionne');
      return;
    }

    try {
      // Creation d'un FormData pour l'upload
      const formData = new FormData();
      const fileName = `recording_${Date.now()}.webm`;
      formData.append('file', this.recordedBlob, fileName);

      // Upload du fichier vers le backend
      const response = await fetch('http://localhost:5000/api/presets/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de l'upload du fichier: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const uploadedPath = result.filePath;

      // Ajout du sample au preset
      this.selectedPreset.samples.push({
        name: `Enregistrement ${this.selectedPreset.samples.length + 1}`,
        url: uploadedPath,
        padIndex: null
      });

      // Sauvegarde du preset mis a jour
      this.presetService.updatePreset(this.selectedPreset._id!, this.selectedPreset).subscribe({
        next: (updatedPreset) => {
          this.selectedPreset = updatedPreset;
          this.closeRecordingModal();
          alert('Enregistrement ajoute au preset avec succes !');
        },
        error: (err) => {
          console.error('Erreur lors de la mise a jour du preset:', err);
          alert('Erreur lors de l\'ajout de l\'enregistrement au preset');
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'enregistrement:', error);
      alert(`Erreur lors de l'upload de l'enregistrement: ${error.message || error}`);
    }
  }

  /**
   * Formate le temps d'enregistrement en MM:SS
   */
  getFormattedTime(): string {
    const minutes = Math.floor(this.recordingTime / 60);
    const seconds = this.recordingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Arrête tous les sons en cours de lecture
   */
  stopAllSounds(): void {
    this.audioService.stopAllSounds();
  }
}
