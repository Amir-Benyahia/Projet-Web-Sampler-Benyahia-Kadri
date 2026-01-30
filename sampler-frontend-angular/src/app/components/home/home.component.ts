import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  features = [
    {
      icon: '',
      title: 'Gestion des Presets',
      description: 'Interface d\'administration pour créer, modifier et supprimer vos presets audio',
      link: '/admin',
      linkText: 'Gérer les presets'
    },
    {
      icon: '',
      title: 'Sampler Audio',
      description: 'Jouez vos samples avec une grille interactive et des contrôles en temps réel',
      link: '/sampler',
      linkText: 'Ouvrir le sampler'
    },
    {
      icon: '',
      title: 'Séquenceur',
      description: 'Créez des patterns rythmiques avec notre séquenceur pas-à-pas',
      link: '/sequencer',
      linkText: 'Créer des patterns'
    },
    {
      icon: '',
      title: 'Effets Audio',
      description: 'Appliquez des effets (reverb, delay, filters) à vos samples en temps réel',
      link: '/effects',
      linkText: 'Explorer les effets'
    }
  ];
}
