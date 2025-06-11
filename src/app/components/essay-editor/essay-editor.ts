import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EssayService, HighlightInfo } from '../../services/essay';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-essay-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './essay-editor.html',
  styleUrls: ['./essay-editor.scss']
})
export class EssayEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('textEditor', { static: true }) textEditor!: ElementRef<HTMLDivElement>;
  
  essayText: string = '';
  highlights: HighlightInfo[] = [];
  
  private subscriptions = new Subscription();

  constructor(private essayService: EssayService) {}

  ngOnInit(): void {
    // Subscribe to essay text changes
    this.subscriptions.add(
      this.essayService.essayText$.subscribe(text => {
        this.essayText = text;
        this.updateDisplay();
      })
    );

    // Subscribe to highlights changes
    this.subscriptions.add(
      this.essayService.highlights$.subscribe(highlights => {
        this.highlights = highlights;
        this.updateDisplay();
      })
    );
  }

  ngAfterViewInit(): void {
    this.initializeEditor();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeEditor(): void {
    // Set initial content
    this.updateDisplay();
  }

  onTextChange(event: Event): void {
    const target = event.target as HTMLDivElement;
    const text = target.innerText || '';
    this.essayService.updateEssayText(text);
  }

  private updateDisplay(): void {
    if (!this.textEditor) return;

    const editor = this.textEditor.nativeElement;
    
    // Store cursor position
    const selection = window.getSelection();
    let cursorPosition = 0;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPosition = range.startOffset;
    }
    
    if (this.highlights.length === 0) {
      // No highlights - just show plain text
      editor.innerHTML = this.escapeHtml(this.essayText);
    } else {
      // Apply highlights
      const highlightedText = this.applyHighlights(this.essayText, this.highlights);
      editor.innerHTML = highlightedText;
    }
    
    // Restore cursor position
    this.restoreCursorPosition(editor, cursorPosition);
  }

  private applyHighlights(text: string, highlights: HighlightInfo[]): string {
    if (highlights.length === 0) {
      return this.escapeHtml(text);
    }

    // Sort highlights by start position (descending) to avoid position shifting
    const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start);
    
    let result = text;
    
    for (const highlight of sortedHighlights) {
      const before = result.substring(0, highlight.start);
      const highlighted = result.substring(highlight.start, highlight.end);
      const after = result.substring(highlight.end);
      
      result = before + `<mark class="highlight">${highlighted}</mark>` + after;
    }

    return result;
  }

  private restoreCursorPosition(editor: HTMLElement, position: number): void {
    try {
      const range = document.createRange();
      const textNode = this.getTextNodeAt(editor, position);
      if (textNode) {
        range.setStart(textNode.node, textNode.offset);
        range.setEnd(textNode.node, textNode.offset);
        
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } catch (e) {
      // Cursor position restoration failed, that's okay
    }
  }

  private getTextNodeAt(element: HTMLElement, targetOffset: number): { node: Text; offset: number } | null {
    let currentOffset = 0;
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      const textNode = node as Text;
      const textLength = textNode.textContent?.length || 0;
      
      if (currentOffset + textLength >= targetOffset) {
        return { node: textNode, offset: targetOffset - currentOffset };
      }
      
      currentOffset += textLength;
    }
    
    return null;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  // Handle paste events to maintain plain text
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  // Prevent formatting from being applied
  onKeyDown(event: KeyboardEvent): void {
    // Prevent bold, italic, etc.
    if (event.ctrlKey || event.metaKey) {
      if (['b', 'i', 'u'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    }
  }

  getWordCount(): number {
    if (!this.essayText.trim()) return 0;
    return this.essayText.trim().split(/\s+/).length;
  }
}
