import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HighlightInfo {
  start: number;
  end: number;
  originalText: string;
}

export interface UndoAction {
  previousText: string;
  timestamp: Date;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class EssayService {
  private essayTextSubject = new BehaviorSubject<string>('');
  private flaggedSentenceSubject = new BehaviorSubject<string>('');
  private suggestedImprovementSubject = new BehaviorSubject<string>('');
  private highlightsSubject = new BehaviorSubject<HighlightInfo[]>([]);
  private undoHistorySubject = new BehaviorSubject<UndoAction[]>([]);

  essayText$ = this.essayTextSubject.asObservable();
  flaggedSentence$ = this.flaggedSentenceSubject.asObservable();
  suggestedImprovement$ = this.suggestedImprovementSubject.asObservable();
  highlights$ = this.highlightsSubject.asObservable();
  undoHistory$ = this.undoHistorySubject.asObservable();

  constructor() {}

  // Update essay text
  updateEssayText(text: string): void {
    this.essayTextSubject.next(text);
    this.updateHighlights();
  }

  // Update flagged sentence
  updateFlaggedSentence(sentence: string): void {
    this.flaggedSentenceSubject.next(sentence);
    this.updateHighlights();
  }

  // Update suggested improvement
  updateSuggestedImprovement(improvement: string): void {
    this.suggestedImprovementSubject.next(improvement);
  }

  // Find and highlight matches
  private updateHighlights(): void {
    const essayText = this.essayTextSubject.value;
    const flaggedSentence = this.flaggedSentenceSubject.value;
    
    if (!flaggedSentence.trim() || !essayText.trim()) {
      this.highlightsSubject.next([]);
      return;
    }

    const highlights: HighlightInfo[] = [];
    const regex = new RegExp(this.escapeRegExp(flaggedSentence), 'gi');
    let match;

    while ((match = regex.exec(essayText)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        originalText: match[0]
      });
    }

    this.highlightsSubject.next(highlights);
  }

  // Apply replacement
  applyReplacement(): void {
    const essayText = this.essayTextSubject.value;
    const flaggedSentence = this.flaggedSentenceSubject.value;
    const suggestedImprovement = this.suggestedImprovementSubject.value;

    if (!flaggedSentence.trim() || !suggestedImprovement.trim()) {
      return;
    }

    // Save current state for undo
    this.saveUndoState(essayText, `Replace "${flaggedSentence}" with "${suggestedImprovement}"`);

    // Replace all instances (case-insensitive)
    const regex = new RegExp(this.escapeRegExp(flaggedSentence), 'gi');
    const updatedText = essayText.replace(regex, suggestedImprovement);

    this.essayTextSubject.next(updatedText);
    
    // Clear highlights after replacement
    this.highlightsSubject.next([]);
    
    // Clear inputs
    this.flaggedSentenceSubject.next('');
    this.suggestedImprovementSubject.next('');
  }

  // Undo last action
  undoLastAction(): boolean {
    const history = this.undoHistorySubject.value;
    if (history.length === 0) {
      return false;
    }

    const lastAction = history[history.length - 1];
    this.essayTextSubject.next(lastAction.previousText);
    
    // Remove the last action from history
    const updatedHistory = history.slice(0, -1);
    this.undoHistorySubject.next(updatedHistory);
    
    this.updateHighlights();
    return true;
  }

  // Save state for undo
  private saveUndoState(text: string, description: string): void {
    const history = this.undoHistorySubject.value;
    const newAction: UndoAction = {
      previousText: text,
      timestamp: new Date(),
      description: description
    };

    // Keep only last 10 undo actions to prevent memory issues
    const updatedHistory = [...history, newAction].slice(-10);
    this.undoHistorySubject.next(updatedHistory);
  }

  // Utility function to escape regex special characters
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Get current values
  getCurrentEssayText(): string {
    return this.essayTextSubject.value;
  }

  getCurrentFlaggedSentence(): string {
    return this.flaggedSentenceSubject.value;
  }

  getCurrentSuggestedImprovement(): string {
    return this.suggestedImprovementSubject.value;
  }

  getCurrentHighlights(): HighlightInfo[] {
    return this.highlightsSubject.value;
  }

  canUndo(): boolean {
    return this.undoHistorySubject.value.length > 0;
  }
}
