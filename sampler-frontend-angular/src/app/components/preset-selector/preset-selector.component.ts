import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Preset } from '../../models/preset.model';
import { PresetService } from '../../services/preset.service';
import { AudioService } from '../../services/audio.service';
import { HttpClient } from '@angular/common/http';


interface HistoryEntry {
  _id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  presetName: string;
  details: string;
  timestamp: string;
}

@Component({
  selector: 'app-preset-selector',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './preset-selector.component.html',
  styleUrls: ['./preset-selector.component.css']
})
export class PresetSelectorComponent implements OnInit {
  presets: Preset[] = [];
  isLoading = false;
  error: string | null = null;
  editingPresetId: string | null = null;
  editingName: string = '';
  showCreateForm = false;
  showHistory = false;
  history: HistoryEntry[] = [];
  urlValidationStatus: Map<string, boolean> = new Map();
  playingSampleUrl: string | null = null;
  newPreset = {
    name: '',
    category: 'Drumkit',
    samples: [{ name: '', url: '' }]
  };

  constructor(
    private presetService: PresetService,
    private audioService: AudioService,
    private http: HttpClient
  ) {
    this.loadHistory();
  }

  ngOnInit(): void {
    this.loadPresets();
    if (typeof window !== 'undefined') {
      this.audioService.initAudioContext();
    }
  }

  loadPresets(): void {
    this.isLoading = true;
    this.error = null;

    this.presetService.getAllPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des presets:', err);
        this.error = 'Impossible de charger les presets. Vérifiez que le backend est démarré.';
        this.isLoading = false;
      }
    });
  }

  startEditing(preset: Preset): void {
    this.editingPresetId = preset._id || null;
    this.editingName = preset.name;
  }

  cancelEditing(): void {
    this.editingPresetId = null;
    this.editingName = '';
  }

  savePresetName(preset: Preset): void {
    if (!this.editingName.trim() || !preset._id) {
      alert('Le nom ne peut pas être vide');
      return;
    }

    const updatedPreset = { ...preset, name: this.editingName.trim() };

    this.presetService.updatePreset(preset._id, updatedPreset).subscribe({
      next: (updated) => {
        const index = this.presets.findIndex(p => p._id === preset._id);
        if (index !== -1) {
          this.presets[index] = updated;
        }
        this.cancelEditing();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        alert('Erreur lors du renommage du preset');
      }
    });
  }

  deletePreset(preset: Preset): void {
    if (!confirm(`Voulez-vous vraiment supprimer le preset "${preset.name}" ?`) || !preset._id) {
      return;
    }

    this.presetService.deletePreset(preset._id).subscribe({
      next: () => {
        this.presets = this.presets.filter(p => p._id !== preset._id);
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression du preset');
      }
    });
  }

  showCreatePresetForm(): void {
    this.showCreateForm = true;
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.newPreset = {
      name: '',
      category: 'Drumkit',
      samples: [{ name: '', url: '' }]
    };
  }

  addSampleRow(): void {
    this.newPreset.samples.push({ name: '', url: '' });
  }

  removeSampleRow(index: number): void {
    if (this.newPreset.samples.length > 1) {
      this.newPreset.samples.splice(index, 1);
    }
  }

  createPreset(): void {
    if (!this.newPreset.name.trim()) {
      alert('Le nom du preset est requis');
      return;
    }

    const validSamples = this.newPreset.samples
      .filter(s => s.name.trim() && s.url.trim())
      .map(s => ({
        name: s.name.trim(),
        url: s.url.trim(),
        padIndex: null
      }));

    const preset = {
      name: this.newPreset.name.trim(),
      category: this.newPreset.category,
      samples: validSamples
    };

    this.presetService.createPreset(preset).subscribe({
      next: (created) => {
        this.presets.unshift(created);
        this.cancelCreate();
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        alert('Erreur lors de la création du preset');
      }
    });
  }

  getSampleCount(preset: Preset): number {
    return preset.samples?.length || 0;
  }

  isEditing(preset: Preset): boolean {
    return this.editingPresetId === preset._id;
  }

  loadHistory(): void {
    this.http.get<HistoryEntry[]>('http://localhost:5000/api/history').subscribe({
      next: (history: HistoryEntry[]) => {
        this.history = history;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement de l\'historique:', err);
      }
    });
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
    if (this.showHistory) {
      this.loadHistory();
    }
  }

  async validateSampleUrl(url: string): Promise<boolean> {
    if (!url || !url.trim()) return false;
    
    const fullUrl = url.startsWith('http') ? url : `http://localhost:5000/presets/${url}`;
    
    try {
      // Pour les URLs externes, essayer de charger directement l'audio
      if (url.startsWith('http') && !url.includes('localhost')) {
        const audio = new Audio();
        return new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            this.urlValidationStatus.set(url, true);
            resolve(true);
          };
          audio.onerror = () => {
            this.urlValidationStatus.set(url, false);
            resolve(false);
          };
          audio.src = fullUrl;
        });
      }
      
      // Pour les URLs locales, utiliser HEAD request
      const response = await fetch(fullUrl, { method: 'HEAD' });
      const isValid = response.ok;
      this.urlValidationStatus.set(url, isValid);
      return isValid;
    } catch {
      this.urlValidationStatus.set(url, false);
      return false;
    }
  }

  isUrlValid(url: string): boolean | undefined {
    return this.urlValidationStatus.get(url);
  }

  validatePresetUrls(preset: Preset): void {
    preset.samples.forEach(sample => {
      this.validateSampleUrl(sample.url);
    });
  }

  async playSample(url: string): Promise<void> {
    this.audioService.initAudioContext();
    
    let fullUrl: string;
    
    // Si c'est une URL externe (non-localhost), utiliser le proxy
    if (url.startsWith('http') && !url.includes('localhost')) {
      fullUrl = `http://localhost:5000/api/proxy-audio?url=${encodeURIComponent(url)}`;
    } else if (url.startsWith('http')) {
      fullUrl = url;
    } else {
      fullUrl = `http://localhost:5000/presets/${url}`;
    }
    
    this.playingSampleUrl = url;
    
    try {
      const buffer = await this.audioService.loadAudioBuffer(fullUrl);
      await this.audioService.playBuffer(buffer);
      this.playingSampleUrl = null;
    } catch (error) {
      console.error('Erreur lors de la lecture du sample:', error);
      this.playingSampleUrl = null;
      alert('Impossible de lire ce sample. Vérifiez que l\'URL est correcte.');
    }
  }

  isPlaying(url: string): boolean {
    return this.playingSampleUrl === url;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'CREATE': return '+';
      case 'UPDATE': return 'M';
      case 'DELETE': return 'X';
      default: return '•';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'CREATE': return '#10b981';
      case 'UPDATE': return '#3b82f6';
      case 'DELETE': return '#ef4444';
      default: return '#6b7280';
    }
  }
}
