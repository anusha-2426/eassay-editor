import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EssayService } from '../../services/essay';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-suggestion-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suggestion-panel.html',
  styleUrls: ['./suggestion-panel.scss']
})
export class SuggestionPanelComponent implements OnInit, OnDestroy {
  flaggedSentence: string = '';
  suggestedImprovement: string = '';
  canUndo: boolean = false;
  highlightCount: number = 0;
  
  private subscriptions = new Subscription();

  constructor(private essayService: EssayService) {}

  ngOnInit(): void {
    // Subscribe to flagged sentence changes
    this.subscriptions.add(
      this.essayService.flaggedSentence$.subscribe(sentence => {
        this.flaggedSentence = sentence;
      })
    );

    // Subscribe to suggested improvement changes
    this.subscriptions.add(
      this.essayService.suggestedImprovement$.subscribe(improvement => {
        this.suggestedImprovement = improvement;
      })
    );

    // Subscribe to undo history changes
    this.subscriptions.add(
      this.essayService.undoHistory$.subscribe(history => {
        this.canUndo = history.length > 0;
      })
    );

    // Subscribe to highlights to show match count
    this.subscriptions.add(
      this.essayService.highlights$.subscribe(highlights => {
        this.highlightCount = highlights.length;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onFlaggedSentenceChange(): void {
    this.essayService.updateFlaggedSentence(this.flaggedSentence);
  }

  onSuggestedImprovementChange(): void {
    this.essayService.updateSuggestedImprovement(this.suggestedImprovement);
  }

  applyReplacement(): void {
    if (this.canApply()) {
      this.essayService.applyReplacement();
    }
  }

  undoLastAction(): void {
    this.essayService.undoLastAction();
  }

  canApply(): boolean {
    return this.flaggedSentence.trim().length > 0 && 
           this.suggestedImprovement.trim().length > 0 &&
           this.highlightCount > 0;
  }

  clearInputs(): void {
    this.flaggedSentence = '';
    this.suggestedImprovement = '';
    this.essayService.updateFlaggedSentence('');
    this.essayService.updateSuggestedImprovement('');
  }

  getMatchText(): string {
    if (this.highlightCount === 0) {
      return 'No matches found';
    } else if (this.highlightCount === 1) {
      return '1 match found';
    } else {
      return `${this.highlightCount} matches found`;
    }
  }

  getApplyButtonText(): string {
    if (this.highlightCount === 0) {
      return 'No matches to apply';
    } else if (this.highlightCount === 1) {
      return 'Apply to 1 match';
    } else {
      return `Apply to ${this.highlightCount} matches`;
    }
  }
}
