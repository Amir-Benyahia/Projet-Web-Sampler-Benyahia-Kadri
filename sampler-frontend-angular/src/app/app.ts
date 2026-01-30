import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, NavigationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Web Sampler Studio';
}
