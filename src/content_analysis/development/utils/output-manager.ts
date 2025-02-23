import { ResearchProgress } from '../services/deep-research';

export class OutputManager {
  private progressLines: number = 4;
  private progressArea: string[] = [];
  private initialized: boolean = false;
  
  constructor() {
    if (typeof window === 'undefined') {
      // Server-side initialization
      this.initialized = true;
    } else {
      // Client-side initialization
      this.initialized = true;
    }
  }
  
  log(...args: any[]) {
    console.log(...args);
  }
  
  updateProgress(progress: ResearchProgress) {
    this.progressArea = [
      `Depth:    [${this.getProgressBar(progress.totalDepth - progress.currentDepth, progress.totalDepth)}] ${Math.round((progress.totalDepth - progress.currentDepth) / progress.totalDepth * 100)}%`,
      `Breadth:  [${this.getProgressBar(progress.totalBreadth - progress.currentBreadth, progress.totalBreadth)}] ${Math.round((progress.totalBreadth - progress.currentBreadth) / progress.totalBreadth * 100)}%`,
      `Queries:  [${this.getProgressBar(progress.completedQueries, progress.totalQueries)}] ${Math.round(progress.completedQueries / progress.totalQueries * 100)}%`,
      progress.currentQuery ? `Current:  ${progress.currentQuery}` : ''
    ];
    
    // Emit progress update event for UI
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('researchProgress', { 
        detail: { 
          progress,
          progressText: this.progressArea 
        } 
      });
      window.dispatchEvent(event);
    }
  }
  
  private getProgressBar(value: number, total: number): string {
    const width = 30; // Fixed width for consistency
    const filled = Math.round((width * value) / total);
    return '█'.repeat(filled) + ' '.repeat(width - filled);
  }
} 