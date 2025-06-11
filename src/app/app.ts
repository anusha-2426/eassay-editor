import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { EssayEditorComponent } from './components/essay-editor/essay-editor';
import { SuggestionPanelComponent } from './components/suggestion-panel/suggestion-panel';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, EssayEditorComponent, SuggestionPanelComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'Interactive Essay Editor';
}
