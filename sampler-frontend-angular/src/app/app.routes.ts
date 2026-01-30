import { Routes } from '@angular/router';

export const routes: Routes = [
  // Page d'accueil
  { 
    path: '', 
    loadComponent: () => import('./components/home/home.component')
      .then(m => m.HomeComponent),
    title: 'Accueil - Web Sampler Studio'
  },
  // Routes administrateur (sans authentification)
  {
    path: 'admin',
    loadComponent: () => import('./components/preset-selector/preset-selector.component')
      .then(m => m.PresetSelectorComponent),
    title: 'Administration - Gestion des Presets'
  },
  // Lazy loading pour les autres composants
  {
    path: 'sampler',
    loadComponent: () => import('./pages/sampler-page/sampler-page.component')
      .then(m => m.SamplerPageComponent),
    title: 'Sampler Audio'
  },
  {
    path: 'sequencer',
    loadComponent: () => import('./components/sequencer/sequencer.component')
      .then(m => m.SequencerComponent),
    title: 'Séquenceur'
  },
  // Route 404
  { 
    path: '**', 
    redirectTo: '' 
  }
];
