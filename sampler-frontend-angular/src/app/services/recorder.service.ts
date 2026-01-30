import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  constructor() {}

  // Demarre l'enregistrement audio depuis le microphone
  async startRecording(): Promise<void> {
    try {
      // Demande d'acces au microphone
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reinitialisation des chunks pour un nouvel enregistrement
      this.audioChunks = [];

      // Creation du MediaRecorder sur le stream audio
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      // Callback appele quand des donnees audio sont disponibles
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Demarrage de l'enregistrement
      this.mediaRecorder.start();
    } catch (error) {
      console.error('Erreur lors du demarrage de l\'enregistrement:', error);
      throw error;
    }
  }

  // Arrete l'enregistrement et retourne le Blob audio
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Aucun enregistrement en cours'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Creation d'un Blob a partir des chunks enregistres
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        // Fermeture du stream du microphone
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        // Nettoyage
        this.mediaRecorder = null;
        this.audioChunks = [];

        resolve(audioBlob);
      };

      // Arret de l'enregistrement
      this.mediaRecorder.stop();
    });
  }

  // Verifie si un enregistrement est en cours
  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }

  // Annule l'enregistrement en cours
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
    this.mediaRecorder = null;
  }
}
