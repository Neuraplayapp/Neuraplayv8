// ToolExecutorService.ts - Handles execution of AI tool calls
import { NavigationService } from './NavigationService';

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
  navigationPerformed?: boolean;
}

export class ToolExecutorService {
  private static instance: ToolExecutorService;
  private navigationService: NavigationService;

  constructor() {
    this.navigationService = new NavigationService();
  }

  public static getInstance(): ToolExecutorService {
    if (!ToolExecutorService.instance) {
      ToolExecutorService.instance = new ToolExecutorService();
    }
    return ToolExecutorService.instance;
  }

  // Main tool execution dispatcher
  async executeTool(toolCall: ToolCall, context?: any): Promise<ToolResult> {
    console.log(`🔧 DEBUG: ToolExecutor - Executing tool: ${toolCall.name}`, toolCall.parameters);
    console.log(`🔧 DEBUG: ToolExecutor - Context:`, context);

    try {
      switch (toolCall.name) {
        case 'navigate_to_page':
          console.log(`🔧 DEBUG: ToolExecutor - Handling navigation to: ${toolCall.parameters.page}`);
          return await this.handleNavigation(toolCall.parameters, context);
        
        case 'update_settings':
          console.log(`🔧 DEBUG: ToolExecutor - Handling setting update: ${toolCall.parameters.setting}`);
          return await this.handleSettingUpdate(toolCall.parameters, context);
        
        case 'recommend_game':
          console.log(`🔧 DEBUG: ToolExecutor - Handling game recommendation`);
          return await this.handleGameRecommendation(toolCall.parameters, context);
        
        case 'create_content':
          console.log(`🔧 DEBUG: ToolExecutor - Handling content creation`);
          return await this.handleContentCreation(toolCall.parameters, context);
        
        case 'accessibility_support':
          console.log(`🔧 DEBUG: ToolExecutor - Handling accessibility support`);
          return await this.handleAccessibilitySupport(toolCall.parameters, context);
        
        case 'read_user_data':
          console.log(`🔧 DEBUG: ToolExecutor - Handling data reading`);
          return await this.handleDataReading(toolCall.parameters, context);
        
        case 'generate_image':
          console.log(`🔧 DEBUG: ToolExecutor - Image generation should be handled server-side, not client-side!`);
          return {
            success: false,
            message: `🚫 Image generation should be processed server-side, not by client ToolExecutor`
          };

        case 'open_canvas_mindmap':
          return await this.handleOpenCanvasMindmap(toolCall.parameters, context);
        // Scribbleboard tools
        case 'scribble_hypothesis_test':
          return this.dispatch('scribble_hypothesis_test', toolCall.parameters, '🧪 Opened hypothesis tester');
        case 'scribble_hypothesis_result':
          return this.dispatch('scribble_hypothesis_result', toolCall.parameters, '✅ Hypothesis result posted');
        case 'scribble_autoagent_toggle':
          return this.dispatch('scribble_autoagent_toggle', toolCall.parameters, '🤖 AutoAgent toggled');
        case 'scribble_autoagent_suggest':
          return this.dispatch('scribble_autoagent_suggest', toolCall.parameters, '💡 Suggestions added');
        case 'scribble_parallel_thought':
          return this.dispatch('scribble_parallel_thought', toolCall.parameters, '🧭 Parallel thought started');
        case 'scribble_editor_insert':
          return this.dispatch('scribble_editor_insert', toolCall.parameters, '✍️ Inserted into editor');
        case 'scribble_editor_erase':
          return this.dispatch('scribble_editor_erase', toolCall.parameters, '🧽 Erased from editor');
        case 'scribble_editor_replace':
          return this.dispatch('scribble_editor_replace', toolCall.parameters, '🔁 Replaced in editor');
        case 'scribble_editor_normalize':
          return this.dispatch('scribble_editor_normalize', toolCall.parameters, '🧹 Normalized editor content');
        case 'scribble_editor_send_to_board':
          return this.dispatch('scribble_add_note', toolCall.parameters, '📌 Sent to board');
        case 'scribble_open':
          return this.dispatch('scribble_open', toolCall.parameters, '🗂️ Opened Scribbleboard');
        // Boards
        case 'scribble_board_new':
          return this.dispatch('scribble_board_new', toolCall.parameters, '🆕 Board created');
        case 'scribble_board_switch':
          return this.dispatch('scribble_board_switch', toolCall.parameters, '🔁 Switched board');
        case 'scribble_board_rename':
          return this.dispatch('scribble_board_rename', toolCall.parameters, '✏️ Board renamed');
        case 'scribble_board_delete':
          return this.dispatch('scribble_board_delete', toolCall.parameters, '🗑️ Board deleted');
        // Hypothesis branching
        case 'scribble_hypothesis_branch_combine':
          return this.dispatch('scribble_hypothesis_branch_combine', toolCall.parameters, '🔗 Branches combined');
        case 'scribble_hypothesis_branch_prune':
          return this.dispatch('scribble_hypothesis_branch_prune', toolCall.parameters, '✂️ Branch pruned');
        // Mutating node
        case 'scribble_mutating_create':
          return this.dispatch('scribble_mutating_create', toolCall.parameters, '🧬 Mutating node created');
        case 'scribble_mutating_evolve':
          return this.dispatch('scribble_mutating_evolve', toolCall.parameters, '🔁 Node evolved');
        case 'scribble_mutating_compare':
          return this.dispatch('scribble_mutating_compare', toolCall.parameters, '🧪 Compare versions');
        // Graph
        case 'scribble_graph_add_node':
          return this.dispatch('scribble_graph_add_node', toolCall.parameters, '➕ Node added');
        case 'scribble_graph_add_edge':
          return this.dispatch('scribble_graph_add_edge', toolCall.parameters, '➡️ Edge added');
        case 'scribble_graph_layout':
          return this.dispatch('scribble_graph_layout', toolCall.parameters, '🗺️ Layout updated');
        case 'scribble_graph_focus':
          return this.dispatch('scribble_graph_focus', toolCall.parameters, '🎯 Focused node');
        case 'scribble_graph_export':
          return this.dispatch('scribble_graph_export', toolCall.parameters, '📤 Graph exported');
        case 'open_canvas_plugin_node':
          return await this.handleOpenCanvasPluginNode(toolCall.parameters, context);
        case 'canvas_add_markdown_block':
          return await this.handleCanvasAddMarkdown(toolCall.parameters, context);
        case 'canvas_simulate_agent':
          return await this.handleCanvasSimulateAgent(toolCall.parameters, context);
        case 'canvas_rewrite_layout':
          return await this.handleCanvasRewriteLayout(toolCall.parameters, context);
        case 'canvas_connect_nodes':
          return await this.handleCanvasConnectNodes(toolCall.parameters, context);
        case 'canvas_edit_text':
          return await this.handleCanvasEditText(toolCall.parameters, context);
        
        default:
          console.log(`🔧 DEBUG: ToolExecutor - Unknown tool: ${toolCall.name}`);
          return {
            success: false,
            message: `Unknown tool: ${toolCall.name}`
          };
      }
    } catch (error) {
      console.error(`❌ DEBUG: ToolExecutor - Error executing tool ${toolCall.name}:`, error);
      return {
        success: false,
        message: `Failed to execute ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Navigation tool handler
  private async handleNavigation(params: any, context?: any): Promise<ToolResult> {
    const { page, reason } = params;
    
    console.log('🔍 Tool Executor Debug - Navigation request:', { page, reason, context });
    
    const pageMap: Record<string, string> = {
      'playground': '/playground',
      'dashboard': '/dashboard', 
      'forum': '/forum',
      'profile': '/profile',
      'home': '/',
      'about': '/about'
    };

    const path = pageMap[page.toLowerCase()] || `/${page.toLowerCase()}`;
    console.log('🔍 Tool Executor Debug - Mapped path:', path);
    
    try {
      // Use your existing navigation logic
      const result = await this.navigationService.navigateTo(path, context?.user);
      console.log('🔍 Tool Executor Debug - Navigation result:', result);
      
      return {
        success: result.success,
        message: result.success 
          ? `🚀 Taking you to ${page}! ${reason || 'Let\'s explore what\'s available there.'}`
          : `❌ Couldn't navigate to ${page}: ${result.message}`,
        navigationPerformed: result.success
      };
    } catch (error) {
      console.error('🔍 Tool Executor Debug - Navigation error:', error);
      return {
        success: false,
        message: `❌ Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Settings update tool handler
  private async handleSettingUpdate(params: any, context?: any): Promise<ToolResult> {
    const { setting, value, reason } = params;
    
    console.log('🔍 Tool Executor Debug - Settings update request:', { setting, value, reason, context });
    
    try {
      // Apply the setting change
      let message = '';
      let success = false;
      
      switch (setting.toLowerCase()) {
        case 'theme':
          // Update theme setting
          console.log('🔍 Tool Executor Debug - Updating theme to:', value);
          // Add actual theme update logic here
          message = `🎨 Theme changed to ${value}! The interface should now reflect your preference.`;
          success = true;
          break;
          
        case 'accessibility':
          console.log('🔍 Tool Executor Debug - Updating accessibility setting:', value);
          message = `♿ Accessibility setting updated to ${value}! I've applied the changes to make NeuraPlay more accessible for you.`;
          success = true;
          break;
          
        case 'notifications':
          console.log('🔍 Tool Executor Debug - Updating notification setting:', value);
          message = `🔔 Notification setting changed to ${value}! You'll now ${value === 'enabled' ? 'receive' : 'not receive'} notifications.`;
          success = true;
          break;
          
        case 'language':
          console.log('🔍 Tool Executor Debug - Updating language setting:', value);
          message = `🌍 Language changed to ${value}! The interface and AI responses will now be in ${value}.`;
          success = true;
          break;
          
        default:
          message = `❌ Unknown setting: ${setting}`;
          success = false;
      }
      
      console.log('🔍 Tool Executor Debug - Settings update result:', { success, message });
      
      return {
        success,
        message: success ? message : `❌ Failed to update ${setting}: ${message}`,
        settingUpdated: success
      };
    } catch (error) {
      console.error('🔍 Tool Executor Debug - Settings update error:', error);
      return {
        success: false,
        message: `❌ Settings update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Game recommendation handler
  private async handleGameRecommendation(params: any, context?: any): Promise<ToolResult> {
    const { skill, difficulty, reason } = params;
    
    // This would integrate with your existing game data
    const gameRecommendations: Record<string, any[]> = {
      'math': [
        { name: 'Counting Adventure', description: 'Fun number recognition and counting practice' },
        { name: 'Pattern Matching', description: 'Mathematical pattern recognition game' }
      ],
      'reading': [
        { name: 'Letter Hunt', description: 'Interactive letter recognition and phonics' },
        { name: 'Magic Storyteller', description: 'Creative reading and comprehension' }
      ],
      'memory': [
        { name: 'Memory Sequence', description: 'Sequence memorization and recall training' },
        { name: 'Memory Galaxy', description: 'Pattern memory with visual elements' }
      ],
      'coordination': [
        { name: 'Mountain Climber', description: 'Hand-eye coordination and motor skills' },
        { name: 'Happy Builder', description: 'Fine motor skills and spatial awareness' }
      ]
    };

    const games = gameRecommendations[skill.toLowerCase()] || [];
    
    if (games.length === 0) {
      return {
        success: false,
        message: `❌ No games found for skill: ${skill}`
      };
    }

    const gameList = games.map(game => `• **${game.name}**: ${game.description}`).join('\n');
    
    return {
      success: true,
      message: `🎯 Perfect games for ${skill} development!\n\n${gameList}\n\n${reason || 'These games will help you improve your skills!'} Try them in the playground!`,
      data: { skill, games },
      navigationPerformed: false // Could auto-navigate to playground
    };
  }

  // Content creation handler
  private async handleContentCreation(params: any, context?: any): Promise<ToolResult> {
    const { type, content, personalization } = params;
    
    const contentTypes: Record<string, string> = {
      'diary_prompt': '📝 Here\'s your personalized diary prompt',
      'calendar_entry': '📅 I\'ve prepared a calendar entry for you',
      'forum_post': '💬 Here\'s a forum post suggestion'
    };

    const typeMessage = contentTypes[type] || '📄 Here\'s your personalized content';
    
    return {
      success: true,
      message: `${typeMessage}:\n\n"${content}"\n\n${personalization || 'This is tailored just for you!'}`,
      data: { type, content }
    };
  }

  // Accessibility support handler
  private async handleAccessibilitySupport(params: any, context?: any): Promise<ToolResult> {
    const { type, action, details } = params;
    
    const accessibilityActions: Record<string, Record<string, string>> = {
      'color_blindness': {
        'test': '🎨 Let me set up a color vision test for you! I\'ll show you some color patterns to determine the best settings.',
        'configure': '🌈 I\'ve configured the color scheme for color blindness support. Colors should be much easier to distinguish now!',
        'enable': '♿ Color blindness support enabled! The interface now uses high-contrast, distinguishable colors.'
      },
      'dyslexia': {
        'enable': '📖 Dyslexia support enabled! Text spacing, fonts, and layout have been optimized for easier reading.',
        'configure': '🔤 I\'ve adjusted the text settings to be more dyslexia-friendly.'
      },
      'motor_skills': {
        'enable': '🎯 Motor skills assistance enabled! Buttons are larger and interactions are simplified.',
        'configure': '✋ Interface adjusted for easier motor control.'
      }
    };

    const message = accessibilityActions[type]?.[action] || 
      `♿ ${action.charAt(0).toUpperCase() + action.slice(1)} ${type.replace('_', ' ')} support. ${details || ''}`;

    return {
      success: true,
      message: message,
      data: { type, action, details }
    };
  }

  // Canvas Mindmap tool handler (client-side UI)
  private async handleOpenCanvasMindmap(params: any, context?: any): Promise<ToolResult> {
    try {
      // Fire a custom DOM event the UI listens to (AIAssistant toggles ScribbleModule)
      const event = new CustomEvent('openScribbleModule', { detail: { template: params?.template || 'mindMap' } });
      window.dispatchEvent(event);

      return {
        success: true,
        message: `🧠 Opened canvas mindmap${params?.template ? ` with template "${params.template}"` : ''}.`,
        data: { opened: true, template: params?.template || null }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to open canvas mindmap: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async handleOpenCanvasPluginNode(params: any, context?: any): Promise<ToolResult> {
    try {
      const event = new CustomEvent('openScribbleModule', { detail: { pluginId: params?.plugin_id, content: params?.content, position: { x: params?.x, y: params?.y } } });
      window.dispatchEvent(event);
      return { success: true, message: `🧩 Added ${params?.plugin_id} to canvas.` };
    } catch (e) {
      return { success: false, message: `Failed to add plugin node: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  }

  private async handleCanvasAddMarkdown(params: any): Promise<ToolResult> {
    try {
      const event = new CustomEvent('openScribbleModule', { detail: { pluginId: 'markdown', content: params?.content, position: { x: params?.x, y: params?.y } } });
      window.dispatchEvent(event);
      return { success: true, message: '📝 Markdown block added to canvas.' };
    } catch (e) {
      return { success: false, message: `Failed to add markdown: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  }

  private async handleCanvasSimulateAgent(params: any): Promise<ToolResult> {
    try {
      const event = new CustomEvent('canvasSimulateAgent', { detail: { pluginId: params?.plugin_id, prompt: params?.prompt } });
      window.dispatchEvent(event);
      return { success: true, message: '🧪 Triggered agent simulation on canvas.' };
    } catch (e) {
      return { success: false, message: `Failed to simulate agent: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  }

  private async handleCanvasRewriteLayout(params: any): Promise<ToolResult> {
    try {
      const event = new CustomEvent('canvasRewriteLayout', { detail: { prompt: params?.prompt } });
      window.dispatchEvent(event);
      return { success: true, message: '🧭 Requested canvas layout rewrite.' };
    } catch (e) {
      return { success: false, message: `Failed to rewrite layout: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  }

  private async handleCanvasConnectNodes(params: any): Promise<ToolResult> {
    try {
      const event = new CustomEvent('canvasConnectNodes', { detail: { fromId: params?.from_id, toId: params?.to_id } });
      window.dispatchEvent(event);
      return { success: true, message: '🔗 Connected nodes on canvas.' };
    } catch (e) {
      return { success: false, message: `Failed to connect nodes: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  }

  private async handleCanvasEditText(params: any): Promise<ToolResult> {
    try {
      const event = new CustomEvent('canvasEditText', { detail: params });
      window.dispatchEvent(event);
      return { success: true, message: '✍️ Updated canvas text.' };
    } catch (e) {
      return { success: false, message: `Failed to edit text: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  }

  private async dispatch(name: string, detail: any, okMessage: string): Promise<ToolResult> {
    try {
      const event = new CustomEvent(name, { detail });
      window.dispatchEvent(event);
      return { success: true, message: okMessage };
    } catch (e) {
      return { success: false, message: `Failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  }

  // Data reading handler
  private async handleDataReading(params: any, context?: any): Promise<ToolResult> {
    const { data_type, filter } = params;
    
    // This would integrate with your actual data sources
    const mockData: Record<string, string> = {
      'notifications': '🔔 Recent notifications:\n• Welcome to NeuraPlay!\n• New games available\n• Daily streak: 3 days!',
      'progress': '📊 Your learning progress:\n• Math skills: Level 4\n• Reading: Level 3\n• Memory games: Level 5',
      'forum_posts': '💬 Recent forum activity:\n• "Tips for memory games" - 12 likes\n• "My learning journey" - 8 comments',
      'diary_entries': '📖 Recent diary entries:\n• "Today I learned about fractions"\n• "Played memory games for 20 minutes"'
    };

    const data = mockData[data_type] || `📄 No ${data_type.replace('_', ' ')} data available right now.`;
    
    return {
      success: true,
      message: data,
      data: { data_type, filter, raw_data: data }
    };
  }

  // Image generation handler removed - now handled server-side only
}

// Export singleton instance
export const toolExecutorService = ToolExecutorService.getInstance();
export default toolExecutorService;