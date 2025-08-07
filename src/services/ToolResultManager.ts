// Ultra-Robust Tool Output Management System with Comprehensive Debugging
// Handles tool results, processing, display coordination, and failure recovery

// Debug levels for granular logging control
export enum DebugLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// Processing stages for detailed failure tracking
export enum ProcessingStage {
  RECEIVED = 'received',
  PARSING = 'parsing',
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  DISPLAY_PREP = 'display_prep',
  COMPLETION = 'completion',
  ERROR = 'error'
}

export interface ToolResult {
  id: string;
  toolName: string;
  success: boolean;
  message: string;
  data?: any;
  timestamp: Date;
  executionTime?: number;
  source: 'server' | 'client';
  rawContent?: string; // Store original for debugging
  processingStage: ProcessingStage;
  debugInfo: DebugInfo;
}

export interface DebugInfo {
  stage: ProcessingStage;
  startTime: number;
  endTime?: number;
  processingTime?: number;
  warnings: DebugMessage[];
  errors: DebugMessage[];
  traces: DebugMessage[];
  dataSize?: number;
  memoryUsage?: number;
  validationResults?: ValidationResult[];
}

export interface DebugMessage {
  level: DebugLevel;
  message: string;
  timestamp: number;
  stage: ProcessingStage;
  data?: any;
  stackTrace?: string;
}

export interface ValidationResult {
  field: string;
  valid: boolean;
  message: string;
  expectedType?: string;
  actualType?: string;
  value?: any;
}

export interface ProcessedToolResult {
  originalResult: ToolResult;
  aiContextSummary: string; // Summarized for AI context 
  frontendData: any; // Full data for frontend display
  displayComponents: DisplayComponent[];
  errorInfo?: ErrorInfo;
  debugSummary: DebugSummary;
  recoveryAttempts?: RecoveryAttempt[];
}

export interface DisplayComponent {
  type: 'image' | 'text' | 'chart' | 'table' | 'error' | 'success' | 'warning' | 'debug';
  content: any;
  metadata?: any;
  priority: number;
  validationPassed: boolean;
  renderHints?: RenderHints;
}

export interface RenderHints {
  preferredWidth?: number;
  preferredHeight?: number;
  responsive?: boolean;
  lazyLoad?: boolean;
  errorFallback?: string;
}

export interface ErrorInfo {
  errorType: string;
  userMessage: string;
  technicalDetails: string;
  retryable: boolean;
  suggestedActions: string[];
  errorCode?: string;
  context?: any;
  debugId?: string;
}

export interface DebugSummary {
  totalProcessingTime: number;
  stageTimings: Record<ProcessingStage, number>;
  errorCount: number;
  warningCount: number;
  validationsPassed: number;
  validationsFailed: number;
  memoryPeak?: number;
  recoverySuccessful?: boolean;
}

export interface RecoveryAttempt {
  strategy: string;
  attempted: Date;
  successful: boolean;
  errorMessage?: string;
  recoveredData?: any;
}

class ToolResultManager {
  private results: Map<string, ProcessedToolResult> = new Map();
  private displayQueue: DisplayComponent[] = [];
  private debugLevel: DebugLevel = DebugLevel.DEBUG;
  private processingStats = {
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    averageProcessingTime: 0,
    lastProcessedTime: 0
  };
  
  constructor(debugLevel: DebugLevel = DebugLevel.DEBUG) {
    this.debugLevel = debugLevel;
    this.log(DebugLevel.INFO, ProcessingStage.RECEIVED, 'ToolResultManager initialized', { debugLevel });
  }
  
  /**
   * Process tool result from server response with comprehensive debugging
   * Separates AI context from frontend display needs
   */
  processServerToolResult(toolResult: any): ProcessedToolResult {
    const startTime = performance.now();
    const resultId = this.generateResultId();
    const debugInfo: DebugInfo = {
      stage: ProcessingStage.RECEIVED,
      startTime,
      warnings: [],
      errors: [],
      traces: [],
      validationResults: []
    };
    
    this.log(DebugLevel.INFO, ProcessingStage.RECEIVED, 'Starting tool result processing', {
      toolName: toolResult?.name,
      hasContent: !!toolResult?.content,
      contentLength: toolResult?.content?.length || 0,
      resultId
    });
    
    let processed: ProcessedToolResult;
    
    try {
      // Stage 1: Input Validation
      debugInfo.stage = ProcessingStage.VALIDATION;
      const validationResults = this.validateToolResult(toolResult);
      debugInfo.validationResults = validationResults;
      
      if (validationResults.some(v => !v.valid)) {
        throw new Error(`Validation failed: ${validationResults.filter(v => !v.valid).map(v => v.message).join(', ')}`);
      }
      
      this.log(DebugLevel.DEBUG, ProcessingStage.VALIDATION, 'Input validation passed', { validationResults });
      
      // Stage 2: Content Parsing
      debugInfo.stage = ProcessingStage.PARSING;
      const resultData = this.parseToolResultContent(toolResult.content, debugInfo);
      
      this.log(DebugLevel.DEBUG, ProcessingStage.PARSING, 'Content parsing successful', {
        success: resultData.success,
        hasData: !!resultData.data,
        dataKeys: resultData.data ? Object.keys(resultData.data) : []
      });
      
      // Stage 3: Processing
      debugInfo.stage = ProcessingStage.PROCESSING;
      const memoryBefore = this.getMemoryUsage();
      
      // Create base result object
      const originalResult: ToolResult = {
        id: resultId,
        toolName: toolResult.name || 'unknown',
        success: resultData.success || false,
        message: resultData.message || 'Tool executed',
        data: resultData.data,
        timestamp: new Date(),
        source: 'server',
        rawContent: toolResult.content,
        processingStage: ProcessingStage.PROCESSING,
        debugInfo
      };
      
      this.log(DebugLevel.TRACE, ProcessingStage.PROCESSING, 'Base result object created', { originalResult });
      
      // Stage 4: Display Preparation
      debugInfo.stage = ProcessingStage.DISPLAY_PREP;
      
      processed = {
        originalResult,
        aiContextSummary: this.createAIContextSummary(resultData, toolResult.name, debugInfo),
        frontendData: this.prepareFrontendData(resultData, debugInfo),
        displayComponents: this.createDisplayComponents(resultData, toolResult.name, debugInfo),
        debugSummary: this.createDebugSummary(debugInfo, startTime),
        recoveryAttempts: []
      };
      
      // Memory tracking
      const memoryAfter = this.getMemoryUsage();
      debugInfo.memoryUsage = memoryAfter - memoryBefore;
      debugInfo.dataSize = JSON.stringify(processed.frontendData).length;
      
      // Stage 5: Completion
      debugInfo.stage = ProcessingStage.COMPLETION;
      debugInfo.endTime = performance.now();
      debugInfo.processingTime = debugInfo.endTime - debugInfo.startTime;
      
      // Store for tracking and debugging
      this.results.set(resultId, processed);
      this.updateProcessingStats(true, debugInfo.processingTime);
      
      this.log(DebugLevel.INFO, ProcessingStage.COMPLETION, 'Tool result processing completed successfully', {
        resultId,
        toolName: toolResult.name,
        processingTime: debugInfo.processingTime,
        hasImage: !!resultData.data?.image_url,
        displayComponents: processed.displayComponents.length,
        frontendDataSize: debugInfo.dataSize,
        memoryUsed: debugInfo.memoryUsage
      });
      
      return processed;
      
    } catch (error) {
      debugInfo.stage = ProcessingStage.ERROR;
      debugInfo.endTime = performance.now();
      debugInfo.processingTime = debugInfo.endTime - debugInfo.startTime;
      
      this.log(DebugLevel.ERROR, ProcessingStage.ERROR, 'Tool result processing failed', {
        error: error.message,
        stack: error.stack,
        toolResult,
        processingTime: debugInfo.processingTime
      });
      
      this.updateProcessingStats(false, debugInfo.processingTime);
      
      // Attempt recovery
      const recoveryResult = this.attemptRecovery(toolResult, error, debugInfo);
      if (recoveryResult.successful) {
        this.log(DebugLevel.INFO, ProcessingStage.COMPLETION, 'Recovery successful', recoveryResult);
        return recoveryResult.processed!;
      }
      
      return this.createErrorResult(toolResult, error, debugInfo);
    }
  }
  
  /**
   * Comprehensive logging system
   */
  private log(level: DebugLevel, stage: ProcessingStage, message: string, data?: any): void {
    if (level > this.debugLevel) return;
    
    const timestamp = Date.now();
    const logMessage: DebugMessage = {
      level,
      message,
      timestamp,
      stage,
      data,
      stackTrace: level === DebugLevel.ERROR ? new Error().stack : undefined
    };
    
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    const prefix = `🔧 ToolResultManager [${levelNames[level]}] [${stage.toUpperCase()}]`;
    
    switch (level) {
      case DebugLevel.ERROR:
        console.error(`${prefix} ${message}`, data || '');
        break;
      case DebugLevel.WARN:
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case DebugLevel.INFO:
        console.info(`${prefix} ${message}`, data || '');
        break;
      case DebugLevel.DEBUG:
      case DebugLevel.TRACE:
        console.log(`${prefix} ${message}`, data || '');
        break;
    }
  }
  
  /**
   * Validate tool result input with comprehensive checks
   */
  private validateToolResult(toolResult: any): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Check if toolResult exists
    results.push({
      field: 'toolResult',
      valid: !!toolResult,
      message: toolResult ? 'Tool result object exists' : 'Tool result object is null/undefined',
      expectedType: 'object',
      actualType: typeof toolResult,
      value: toolResult
    });
    
    if (!toolResult) return results;
    
    // Validate tool name
    results.push({
      field: 'name',
      valid: typeof toolResult.name === 'string' && toolResult.name.length > 0,
      message: typeof toolResult.name === 'string' && toolResult.name.length > 0 ? 
        'Tool name is valid' : 'Tool name is missing or invalid',
      expectedType: 'string',
      actualType: typeof toolResult.name,
      value: toolResult.name
    });
    
    // Validate content
    const hasContent = toolResult.content && typeof toolResult.content === 'string';
    results.push({
      field: 'content',
      valid: hasContent,
      message: hasContent ? 'Content exists and is string' : 'Content is missing or not a string',
      expectedType: 'string',
      actualType: typeof toolResult.content,
      value: hasContent ? `${toolResult.content.length} characters` : toolResult.content
    });
    
    // Validate content is not empty
    if (hasContent) {
      const notEmpty = toolResult.content.trim().length > 0;
      results.push({
        field: 'content.length',
        valid: notEmpty,
        message: notEmpty ? 'Content is not empty' : 'Content is empty string',
        expectedType: 'non-empty string',
        actualType: `string with ${toolResult.content.length} characters`,
        value: toolResult.content.length
      });
    }
    
    return results;
  }
  
  /**
   * Parse tool result content safely with enhanced debugging
   */
  private parseToolResultContent(content: string, debugInfo: DebugInfo): any {
    this.log(DebugLevel.TRACE, ProcessingStage.PARSING, 'Starting content parsing', {
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) + (content?.length > 100 ? '...' : '')
    });
    
    if (!content) {
      const error = new Error('Tool result content is empty');
      debugInfo.errors.push({
        level: DebugLevel.ERROR,
        message: 'Content validation failed: empty content',
        timestamp: Date.now(),
        stage: ProcessingStage.PARSING,
        data: { contentReceived: content }
      });
      throw error;
    }
    
    // Try standard JSON parsing first
    try {
      const parsed = JSON.parse(content);
      this.log(DebugLevel.DEBUG, ProcessingStage.PARSING, 'Standard JSON parsing successful', {
        parsedKeys: typeof parsed === 'object' ? Object.keys(parsed) : 'not-object',
        dataType: typeof parsed
      });
      return parsed;
    } catch (jsonError) {
      this.log(DebugLevel.WARN, ProcessingStage.PARSING, 'Standard JSON parsing failed, attempting recovery', {
        error: jsonError.message,
        contentSample: content.substring(0, 200)
      });
      
      debugInfo.warnings.push({
        level: DebugLevel.WARN,
        message: 'JSON parsing failed, attempting recovery',
        timestamp: Date.now(),
        stage: ProcessingStage.PARSING,
        data: { error: jsonError.message, contentLength: content.length }
      });
      
      // Attempt progressive recovery strategies
      const recoveryStrategies = [
        () => this.recoverImageResult(content),
        () => this.recoverBasicResult(content),
        () => this.recoverWithRegexCleaning(content),
        () => this.recoverPartialJSON(content),
        () => this.createFallbackResult(content)
      ];
      
      for (let i = 0; i < recoveryStrategies.length; i++) {
        try {
          const result = recoveryStrategies[i]();
          this.log(DebugLevel.INFO, ProcessingStage.PARSING, `Recovery strategy ${i + 1} successful`, {
            strategy: recoveryStrategies[i].name,
            recoveredData: result
          });
          
          debugInfo.traces.push({
            level: DebugLevel.INFO,
            message: `Recovery successful with strategy ${i + 1}`,
            timestamp: Date.now(),
            stage: ProcessingStage.PARSING,
            data: { strategyIndex: i, result }
          });
          
          return result;
        } catch (recoveryError) {
          this.log(DebugLevel.DEBUG, ProcessingStage.PARSING, `Recovery strategy ${i + 1} failed`, {
            strategy: recoveryStrategies[i].name,
            error: recoveryError.message
          });
        }
      }
      
      // All recovery strategies failed
      const finalError = new Error(`All parsing strategies failed. Original error: ${jsonError.message}`);
      debugInfo.errors.push({
        level: DebugLevel.ERROR,
        message: 'All recovery strategies failed',
        timestamp: Date.now(),
        stage: ProcessingStage.PARSING,
        data: { originalError: jsonError.message, contentPreview: content.substring(0, 100) }
      });
      
      throw finalError;
    }
  }
  
  /**
   * Create AI context summary (for token efficiency) with debugging
   */
  private createAIContextSummary(resultData: any, toolName: string, debugInfo: DebugInfo): string {
    this.log(DebugLevel.TRACE, ProcessingStage.PROCESSING, 'Creating AI context summary', {
      toolName,
      hasData: !!resultData.data
    });
    
    const summary = {
      success: resultData.success,
      tool: toolName,
      message: resultData.message || 'Tool executed'
    };
    
    // Add essential metadata without large data
    if (resultData.data) {
      summary['metadata'] = {
        hasImage: !!resultData.data.image_url,
        hasData: !!resultData.data,
        contentType: this.identifyContentType(resultData.data),
        size: resultData.data.size || 'standard'
      };
      
      this.log(DebugLevel.DEBUG, ProcessingStage.PROCESSING, 'AI summary metadata created', summary['metadata']);
    }
    
    const summaryString = JSON.stringify(summary);
    
    debugInfo.traces.push({
      level: DebugLevel.TRACE,
      message: 'AI context summary created',
      timestamp: Date.now(),
      stage: ProcessingStage.PROCESSING,
      data: { summaryLength: summaryString.length, summary }
    });
    
    return summaryString;
  }
  
  /**
   * Prepare full frontend data (including images) with comprehensive validation
   */
  private prepareFrontendData(resultData: any, debugInfo: DebugInfo): any {
    this.log(DebugLevel.TRACE, ProcessingStage.DISPLAY_PREP, 'Preparing frontend data', {
      success: resultData.success,
      hasData: !!resultData.data
    });
    
    if (!resultData.success) {
      const errorData = {
        error: true,
        message: resultData.message || 'Tool execution failed',
        timestamp: Date.now(),
        recoverable: true
      };
      
      this.log(DebugLevel.WARN, ProcessingStage.DISPLAY_PREP, 'Preparing error data for frontend', errorData);
      return errorData;
    }
    
    // Validate and prepare successful data
    const frontendData = {
      success: true,
      message: resultData.message || 'Tool executed successfully',
      data: resultData.data || {},
      timestamp: Date.now(),
      // Preserve all image and media data with validation
      hasImage: this.validateImageData(resultData.data?.image_url),
      hasChart: !!resultData.data?.chart_data,
      hasTable: !!resultData.data?.table_data,
      metadata: {
        dataSize: JSON.stringify(resultData.data || {}).length,
        contentTypes: this.analyzeContentTypes(resultData.data)
      }
    };
    
    // Validate image URL if present
    if (frontendData.hasImage && resultData.data?.image_url) {
      try {
        this.validateImageUrl(resultData.data.image_url);
        frontendData.metadata['imageValid'] = true;
      } catch (validationError) {
        this.log(DebugLevel.WARN, ProcessingStage.DISPLAY_PREP, 'Image validation failed', {
          error: validationError.message,
          imageUrl: resultData.data.image_url.substring(0, 100) + '...'
        });
        
        frontendData.metadata['imageValid'] = false;
        frontendData.metadata['imageError'] = validationError.message;
      }
    }
    
    this.log(DebugLevel.DEBUG, ProcessingStage.DISPLAY_PREP, 'Frontend data prepared', {
      hasImage: frontendData.hasImage,
      hasChart: frontendData.hasChart,
      hasTable: frontendData.hasTable,
      dataSize: frontendData.metadata.dataSize
    });
    
    debugInfo.traces.push({
      level: DebugLevel.DEBUG,
      message: 'Frontend data preparation completed',
      timestamp: Date.now(),
      stage: ProcessingStage.DISPLAY_PREP,
      data: frontendData.metadata
    });
    
    return frontendData;
  }
  
  /**
   * Create display components for frontend rendering
   */
  private createDisplayComponents(resultData: any, toolName: string): DisplayComponent[] {
    const components: DisplayComponent[] = [];
    
    if (!resultData.success) {
      components.push({
        type: 'error',
        content: resultData.message || 'Tool execution failed',
        priority: 1
      });
      return components;
    }
    
    // Success message component
    components.push({
      type: 'success',
      content: resultData.message || 'Tool executed successfully',
      metadata: { toolName },
      priority: 2
    });
    
    // Image component (highest priority)
    if (resultData.data?.image_url) {
      components.push({
        type: 'image',
        content: resultData.data.image_url,
        metadata: {
          caption: resultData.data.caption || resultData.message,
          style: resultData.data.style || 'default',
          size: resultData.data.size || 'standard',
          prompt: resultData.data.prompt
        },
        priority: 1
      });
    }
    
    // Chart component
    if (resultData.data?.chart_data) {
      components.push({
        type: 'chart',
        content: resultData.data.chart_data,
        metadata: {
          title: resultData.data.title,
          chartType: resultData.data.chart_type
        },
        priority: 1
      });
    }
    
    // Table component
    if (resultData.data?.table_data) {
      components.push({
        type: 'table',
        content: resultData.data.table_data,
        metadata: {
          title: resultData.data.title,
          headers: resultData.data.headers
        },
        priority: 2
      });
    }
    
    // Sort by priority (lower number = higher priority)
    return components.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Recover image result from corrupted JSON
   */
  private recoverImageResult(content: string): any {
    console.log('🔧 ToolResultManager: Attempting image result recovery');
    
    // Extract image URL using regex
    const imageUrlMatch = content.match(/"image_url":\s*"([^"]+)"/);
    const messageMatch = content.match(/"message":\s*"([^"]+)"/);
    const successMatch = content.match(/"success":\s*(true|false)/);
    
    if (imageUrlMatch) {
      return {
        success: successMatch ? successMatch[1] === 'true' : true,
        message: messageMatch ? messageMatch[1] : 'Image generated successfully',
        data: {
          image_url: imageUrlMatch[1]
        }
      };
    }
    
    throw new Error('Could not recover image data from corrupted JSON');
  }
  
  /**
   * Recover basic result from corrupted JSON
   */
  private recoverBasicResult(content: string): any {
    const successMatch = content.match(/"success":\s*(true|false)/);
    const messageMatch = content.match(/"message":\s*"([^"]+)"/);
    
    return {
      success: successMatch ? successMatch[1] === 'true' : false,
      message: messageMatch ? messageMatch[1] : 'Tool execution completed',
      data: {}
    };
  }
  
  /**
   * Create error result for failed processing
   */
  private createErrorResult(toolResult: any, error: Error): ProcessedToolResult {
    const errorInfo: ErrorInfo = {
      errorType: 'processing_failed',
      userMessage: 'There was an issue processing the tool result',
      technicalDetails: error.message,
      retryable: true,
      suggestedActions: ['Try the request again', 'Contact support if issue persists']
    };
    
    return {
      originalResult: {
        id: this.generateResultId(),
        toolName: toolResult.name || 'unknown',
        success: false,
        message: errorInfo.userMessage,
        timestamp: new Date(),
        source: 'server'
      },
      aiContextSummary: JSON.stringify({ 
        success: false, 
        error: errorInfo.userMessage 
      }),
      frontendData: { error: true, message: errorInfo.userMessage },
      displayComponents: [{
        type: 'error',
        content: errorInfo.userMessage,
        metadata: errorInfo,
        priority: 1
      }],
      errorInfo
    };
  }
  
  /**
   * Identify content type for metadata
   */
  private identifyContentType(data: any): string {
    if (data?.image_url) return 'image';
    if (data?.chart_data) return 'chart';
    if (data?.table_data) return 'table';
    if (data?.text) return 'text';
    return 'unknown';
  }
  
  /**
   * Generate unique result ID
   */
  private generateResultId(): string {
    return `tool_result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get processing statistics for debugging
   */
  getProcessingStats(): any {
    return {
      totalProcessed: this.results.size,
      successRate: Array.from(this.results.values())
        .filter(r => r.originalResult.success).length / this.results.size,
      errorRate: Array.from(this.results.values())
        .filter(r => r.errorInfo).length / this.results.size,
      averageProcessingTime: 'Not implemented yet'
    };
  }
  
  /**
   * Clear old results (memory management)
   */
  cleanup(maxAge: number = 3600000): void { // 1 hour default
    const cutoff = Date.now() - maxAge;
    for (const [id, result] of this.results.entries()) {
      if (result.originalResult.timestamp.getTime() < cutoff) {
        this.results.delete(id);
      }
    }
  }
}

// Export singleton instance
export const toolResultManager = new ToolResultManager();
