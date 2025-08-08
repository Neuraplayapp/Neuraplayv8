// For Node.js versions without native fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Tool Schema Definition for GPT-OSS
const tools = [
  {
    "type": "function",
    "function": {
      "name": "navigate_to_page",
      "description": "Navigate the user to a different page within the NeuraPlay application. Use this when users want to go to specific sections like playground, dashboard, forum, or profile.",
      "parameters": {
        "type": "object",
        "properties": {
          "page": {
            "type": "string",
            "enum": ["playground", "dashboard", "forum", "profile", "home", "about"],
            "description": "The page to navigate to"
          },
          "reason": {
            "type": "string",
            "description": "Optional reason for navigation"
          }
        },
        "required": ["page"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_open",
      "description": "Open the Scribbleboard/Text Workbench UI on the client in compact or fullscreen mode.",
      "parameters": {
        "type": "object",
        "properties": {
          "mode": { "type": "string", "enum": ["compact", "fullscreen"], "description": "Display mode" }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_hypothesis_test",
      "description": "Add a hypothesis tester card to the active Scribbleboard and start a simulation.",
      "parameters": {
        "type": "object",
        "properties": { "prompt": { "type": "string" } },
        "required": ["prompt"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_hypothesis_result",
      "description": "Post a result to a hypothesis card on the Scribbleboard.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "estimate": { "type": "string" },
          "confidence": { "type": "string" },
          "title": { "type": "string" }
        },
        "required": ["id", "estimate", "confidence"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_autoagent_toggle",
      "description": "Enable or disable AutoAgent suggestions on the Scribbleboard.",
      "parameters": { "type": "object", "properties": { "enabled": { "type": "boolean" } } }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_autoagent_suggest",
      "description": "Push AutoAgent suggestion strings to the board.",
      "parameters": { "type": "object", "properties": { "suggestions": { "type": "array", "items": { "type": "string" } } }, "required": ["suggestions"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_parallel_thought",
      "description": "Start a parallel thought split with left and right prompts.",
      "parameters": { "type": "object", "properties": { "leftPrompt": { "type": "string" }, "rightPrompt": { "type": "string" } } }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_board_new",
      "description": "Create a new board and switch to it.",
      "parameters": { "type": "object", "properties": { "name": { "type": "string" } } }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_board_switch",
      "description": "Switch active board by id.",
      "parameters": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_board_rename",
      "description": "Rename a board by id.",
      "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "name": { "type": "string" } }, "required": ["id", "name"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_board_delete",
      "description": "Delete a board by id.",
      "parameters": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_mutating_create",
      "description": "Create a mutating node with a title.",
      "parameters": { "type": "object", "properties": { "title": { "type": "string" } } }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_mutating_evolve",
      "description": "Evolve a mutating node by id to a new type.",
      "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "toType": { "type": "string" } }, "required": ["id"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_mutating_compare",
      "description": "Open versions/compare UI for a mutating node.",
      "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "versionIndex": { "type": "number" } }, "required": ["id"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_mutating_evolve_feedback",
      "description": "Evolve a mutating node using structured feedback and goals, storing a new version.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "feedback": { "type": "string" },
          "goal": { "type": "string" },
          "constraints": { "type": "string" }
        },
        "required": ["id", "feedback"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_graph_add_node",
      "description": "Add a graph node to board graph.",
      "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "label": { "type": "string" }, "type": { "type": "string" } }, "required": ["label"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_graph_add_edge",
      "description": "Add a graph edge.",
      "parameters": { "type": "object", "properties": { "from": { "type": "string" }, "to": { "type": "string" }, "label": { "type": "string" } }, "required": ["from", "to"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_graph_layout",
      "description": "Request graph layout.",
      "parameters": { "type": "object", "properties": {} }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_graph_focus",
      "description": "Focus a graph node by id.",
      "parameters": { "type": "object", "properties": { "nodeId": { "type": "string" } }, "required": ["nodeId"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_graph_export",
      "description": "Export graph as png or svg.",
      "parameters": { "type": "object", "properties": { "format": { "type": "string", "enum": ["png", "svg"] } }, "required": ["format"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_editor_insert",
      "description": "Insert text into the Text Workbench.",
      "parameters": { "type": "object", "properties": { "text": { "type": "string" } }, "required": ["text"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_editor_erase",
      "description": "Erase a substring from the Text Workbench contents.",
      "parameters": { "type": "object", "properties": { "text": { "type": "string" } }, "required": ["text"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_editor_replace",
      "description": "Replace substring in the Text Workbench contents.",
      "parameters": { "type": "object", "properties": { "target": { "type": "string" }, "with": { "type": "string" } }, "required": ["target", "with"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_editor_normalize",
      "description": "Normalize markdown/cleanup in the Text Workbench.",
      "parameters": { "type": "object", "properties": {} }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_editor_send_to_board",
      "description": "Send current editor text as a note/card to the Scribbleboard.",
      "parameters": { "type": "object", "properties": { "text": { "type": "string" } }, "required": ["text"] }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "scribble_editor_scaffold_hypothesis",
      "description": "Prepare the Text Workbench with two hypothesis lines and basic structure.",
      "parameters": {
        "type": "object",
        "properties": { "a": { "type": "string" }, "b": { "type": "string" } }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_wikipedia_summary",
      "description": "Fetch a concise Wikipedia summary (with thumbnail if available) for a topic or entity.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Topic or entity name to look up on Wikipedia"
          }
        },
        "required": ["query"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "open_canvas_plugin_node",
      "description": "Open the canvas and add a plugin node (markdown, goal-tree, auto-agent, etc.) at an optional position.",
      "parameters": {
        "type": "object",
        "properties": {
          "plugin_id": {
            "type": "string",
            "description": "The plugin identifier to add",
            "enum": [
              "markdown","auto-agent","canvas-rewriter","agent-simulator","goal-tree","problem-resolver","parallel-thought","cog-map","hypothesis-tester"
            ]
          },
          "content": { "type": "string", "description": "Optional initial content" },
          "x": { "type": "number" },
          "y": { "type": "number" }
        },
        "required": ["plugin_id"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "canvas_add_markdown_block",
      "description": "Open the canvas and add a Markdown block with provided content.",
      "parameters": {
        "type": "object",
        "properties": {
          "content": { "type": "string" },
          "x": { "type": "number" },
          "y": { "type": "number" }
        },
        "required": ["content"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "canvas_simulate_agent",
      "description": "Simulate a plugin agent node with an optional prompt and surface results on canvas.",
      "parameters": {
        "type": "object",
        "properties": {
          "plugin_id": { "type": "string" },
          "prompt": { "type": "string" }
        },
        "required": ["plugin_id"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "canvas_rewrite_layout",
      "description": "Ask the agent to rewrite/organize the canvas layout based on a prompt.",
      "parameters": {
        "type": "object",
        "properties": {
          "prompt": { "type": "string" }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "canvas_connect_nodes",
      "description": "Connect two canvas nodes by id.",
      "parameters": {
        "type": "object",
        "properties": {
          "from_id": { "type": "string" },
          "to_id": { "type": "string" }
        },
        "required": ["from_id","to_id"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "canvas_edit_text",
      "description": "Edit the currently selected text/markdown node on the canvas by inserting, erasing, or replacing text.",
      "parameters": {
        "type": "object",
        "properties": {
          "insert": { "type": "string", "description": "Text to insert (appended to content if no target)" },
          "erase": { "type": "string", "description": "Substring to remove from content" },
          "replace": {
            "type": "object",
            "properties": {
              "target": { "type": "string" },
              "with": { "type": "string" }
            },
            "required": ["target","with"]
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "web_news_search",
      "description": "Search recent news using Serper and return a curated list of articles.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "News query"
          },
          "timeRange": {
            "type": "string",
            "enum": ["day", "week", "month"],
            "description": "Optional recency filter"
          }
        },
        "required": ["query"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "update_settings",
      "description": "Update user settings like theme, accessibility, or preferences. Use this when users want to change their experience.",
      "parameters": {
        "type": "object",
        "properties": {
          "setting": {
            "type": "string",
            "enum": ["theme", "accessibility", "notifications", "language"],
            "description": "The setting to update"
          },
          "value": {
            "type": "string",
            "description": "The new value for the setting"
          }
        },
        "required": ["setting", "value"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "recommend_game",
      "description": "Recommend educational games based on user interests, age, or learning goals. Use this when users want to play games or learn specific topics.",
      "parameters": {
        "type": "object",
        "properties": {
          "topic": {
            "type": "string",
            "description": "The learning topic or subject area"
          },
          "age_group": {
            "type": "string",
            "enum": ["3-5", "6-8", "9-12", "13+"],
            "description": "The age group for game recommendations"
          },
          "difficulty": {
            "type": "string",
            "enum": ["easy", "medium", "hard"],
            "description": "The difficulty level"
          }
        },
        "required": ["topic"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "web_search",
      "description": "Searches the live internet for up-to-date information, news, current events, or topics beyond its 2023 knowledge cutoff.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "A concise search query, like one you would type into Google."
          }
        },
        "required": ["query"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Retrieves the current weather for a specific location.",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and country, e.g., 'Taraz, Kazakhstan'."
          }
        },
        "required": ["location"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "accessibility_support",
      "description": "Apply accessibility settings for users with disabilities like color blindness, visual impairments, or other accessibility needs.",
      "parameters": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["color_blindness_support", "high_contrast", "large_text", "screen_reader"],
            "description": "The type of accessibility support needed"
          },
          "subtype": {
            "type": "string",
            "enum": ["protanopia", "deuteranopia", "tritanopia"],
            "description": "For color blindness, the specific type"
          }
        },
        "required": ["type"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "open_canvas_mindmap",
      "description": "Open the interactive canvas mindmap tool (ScribbleModule) to plan, organize and act on user prompts.",
      "parameters": {
        "type": "object",
        "properties": {
          "template": {
            "type": "string",
            "enum": ["mindMap", "projectPlan", "chartDashboard"],
            "description": "Optional template to load"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "generate_image",
      "description": "Generate creative, educational, or artistic images based on user descriptions. Use this when users want to create, make, draw, or generate visual content.",
      "parameters": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "description": "Detailed description of the image to generate, including style, colors, objects, mood, etc."
          },
          "style": {
            "type": "string",
            "enum": ["realistic", "cartoon", "artistic", "educational", "child-friendly"],
            "description": "The visual style for the image"
          },
          "size": {
            "type": "string",
            "enum": ["512x512", "768x768", "1024x1024"],
            "description": "The size of the generated image"
          }
        },
        "required": ["prompt"]
      }
    }
  },
  {
    "type": "function", 
    "function": {
      "name": "create_math_diagram",
      "description": "Create beautiful, pedagogical mathematical diagrams and visualizations. Use for distance calculations, geometric concepts, data visualization, and educational illustrations.",
      "parameters": {
        "type": "object",
        "properties": {
          "concept": {
            "type": "string",
            "description": "The mathematical concept to illustrate (e.g., 'distance to moon', 'histogram', 'orbital mechanics', 'scale comparison')"
          },
          "data": {
            "type": "object",
            "description": "Relevant data for the diagram (numbers, labels, values, etc.)",
            "additionalProperties": true
          },
          "title": {
            "type": "string", 
            "description": "Title for the diagram"
          },
          "style": {
            "type": "string",
            "enum": ["clean", "colorful", "scientific", "child-friendly"],
            "description": "Visual style of the diagram"
          }
        },
        "required": ["concept", "title"]
      }
    }
  }
];

// INTELLIGENT TOOL ROUTING SYSTEM
const TOOL_ROUTING_CONFIG = {
  // Server-side tools (require server resources)
  server: {
    'web_search': {
      reason: 'Requires Serper API key and external API access',
      requires: ['api_key', 'external_api']
    },
    'get_weather': {
      reason: 'Requires Weather API key and external API access', 
      requires: ['api_key', 'external_api']
    },
    'generate_image': {
      reason: 'Requires Together AI API key for external API access',
      requires: ['api_key', 'external_api']
    },
    'create_math_diagram': {
      reason: 'Requires server-side SVG generation and mathematical processing',
      requires: ['server_processing', 'svg_generation']
    },
    'get_wikipedia_summary': {
      reason: 'Server fetch to Wikipedia REST API',
      requires: ['external_api']
    },
    'web_news_search': {
      reason: 'Server fetch to Serper News API',
      requires: ['api_key', 'external_api']
    }
  },
  
  // Client-side tools (require browser/UI access)
  client: {
    'navigate_to_page': {
      reason: 'Requires React Router and browser navigation',
      requires: ['react_router', 'browser_api', 'ui_manipulation']
    },
    'update_settings': {
      reason: 'Requires local state management and UI updates',
      requires: ['local_storage', 'react_state', 'ui_manipulation']
    },
    'recommend_game': {
      reason: 'Requires user context and UI interaction',
      requires: ['user_context', 'ui_manipulation']
    },
    'accessibility_support': {
      reason: 'Requires CSS/DOM manipulation and browser APIs',
      requires: ['dom_manipulation', 'css_changes', 'browser_api']
    },
    'open_canvas_mindmap': {
      reason: 'Opens ScribbleModule mindmap UI on the client',
      requires: ['ui_manipulation', 'browser_api']
    },
    'scribble_hypothesis_test': { reason: 'Opens hypothesis tester card', requires: ['ui_manipulation'] },
    'scribble_hypothesis_result': { reason: 'Post result to hypothesis card', requires: ['ui_manipulation'] },
    'scribble_autoagent_toggle': { reason: 'Toggle autoagent on board', requires: ['ui_manipulation'] },
    'scribble_autoagent_suggest': { reason: 'Add suggestions to board', requires: ['ui_manipulation'] },
    'scribble_parallel_thought': { reason: 'Start two visible branches', requires: ['ui_manipulation'] },
    'scribble_open': { reason: 'Opens Scribbleboard/Workbench overlay on client', requires: ['ui_manipulation', 'browser_api'] },
    'scribble_board_new': { reason: 'Create new board', requires: ['ui_manipulation'] },
    'scribble_board_switch': { reason: 'Switch board', requires: ['ui_manipulation'] },
    'scribble_board_rename': { reason: 'Rename board', requires: ['ui_manipulation'] },
    'scribble_board_delete': { reason: 'Delete board', requires: ['ui_manipulation'] },
    'scribble_mutating_create': { reason: 'Create mutating node', requires: ['ui_manipulation'] },
    'scribble_mutating_evolve': { reason: 'Evolve node', requires: ['ui_manipulation'] },
    'scribble_mutating_compare': { reason: 'Compare versions', requires: ['ui_manipulation'] },
    'scribble_mutating_evolve_feedback': { reason: 'Evolve node with feedback/goals', requires: ['ui_manipulation'] },
    'scribble_graph_add_node': { reason: 'Add graph node', requires: ['ui_manipulation'] },
    'scribble_graph_add_edge': { reason: 'Add graph edge', requires: ['ui_manipulation'] },
    'scribble_graph_layout': { reason: 'Layout graph', requires: ['ui_manipulation'] },
    'scribble_graph_focus': { reason: 'Focus graph node', requires: ['ui_manipulation'] },
    'scribble_graph_export': { reason: 'Export graph', requires: ['ui_manipulation'] },
    'scribble_editor_insert': { reason: 'Insert into TextWorkbench', requires: ['ui_manipulation'] },
    'scribble_editor_erase': { reason: 'Erase from TextWorkbench', requires: ['ui_manipulation'] },
    'scribble_editor_replace': { reason: 'Replace in TextWorkbench', requires: ['ui_manipulation'] },
    'scribble_editor_normalize': { reason: 'Normalize TextWorkbench', requires: ['ui_manipulation'] },
    'scribble_editor_send_to_board': { reason: 'Send editor text to board', requires: ['ui_manipulation'] },
    'scribble_editor_scaffold_hypothesis': { reason: 'Preload hypothesis lines in editor', requires: ['ui_manipulation'] },
    'open_canvas_plugin_node': {
      reason: 'Opens canvas and inserts a plugin node via client event',
      requires: ['ui_manipulation', 'browser_api']
    },
    'canvas_add_markdown_block': {
      reason: 'Adds markdown block to canvas on client',
      requires: ['ui_manipulation', 'browser_api']
    },
    'canvas_simulate_agent': {
      reason: 'Triggers agent simulation for a plugin node on client',
      requires: ['ui_manipulation', 'browser_api']
    },
    'canvas_rewrite_layout': {
      reason: 'Triggers canvas rewriting action on client',
      requires: ['ui_manipulation', 'browser_api']
    },
    'canvas_connect_nodes': {
      reason: 'Connects two nodes on client',
      requires: ['ui_manipulation', 'browser_api']
    }
  }
};

// Extract server-side tool names for quick lookup
const SERVER_SIDE_TOOLS = Object.keys(TOOL_ROUTING_CONFIG.server);

// Tool execution functions (SERVER-SIDE ONLY)
async function executeTool(toolCall) {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);
  
  console.log(`🔧 Server executing tool: ${name} with args:`, parsedArgs);
  
  // Only execute server-side tools here
  if (!SERVER_SIDE_TOOLS.includes(name)) {
    const clientToolConfig = TOOL_ROUTING_CONFIG.client[name];
    console.log(`📤 Client-side tool ${name} - delegating to client`);
    console.log(`📋 Reason: ${clientToolConfig?.reason || 'Unknown client-side tool'}`);
    
    return {
      success: true,
      message: `Tool ${name} will be executed on client (${clientToolConfig?.reason || 'UI/browser functionality required'})`,
      data: { 
        delegatedToClient: true,
        toolConfig: clientToolConfig,
        executionLocation: 'client'
      }
    };
  }
  
  const serverToolConfig = TOOL_ROUTING_CONFIG.server[name];
  console.log(`🖥️ Server-side tool ${name} - executing on server`);
  console.log(`📋 Reason: ${serverToolConfig?.reason || 'Unknown server-side tool'}`);
  console.log(`⚙️ Requirements: ${serverToolConfig?.requires?.join(', ') || 'Unknown'}`);
  
  switch (name) {
    case 'web_search':
      return await performWebSearch(parsedArgs.query);
      
    case 'get_weather':
      return await getWeatherData(parsedArgs.location);
      
    case 'generate_image':
      return await handleImageGenerationTool(parsedArgs);
      
    case 'create_math_diagram':
      return await createMathDiagram(parsedArgs);
    case 'get_wikipedia_summary':
      return await getWikipediaSummary(parsedArgs.query);
    case 'web_news_search':
      return await performNewsSearch(parsedArgs.query, parsedArgs.timeRange);
      
    default:
      return {
        success: false,
        message: `Unknown server-side tool: ${name}`
      };
  }
}

async function performWebSearch(query) {
  try {
    console.log('🔍 DEBUG: performWebSearch called with query:', query);
    const SERPER_API_KEY = process.env.Serper_api;
    console.log('🔍 DEBUG: Serper API key exists:', !!SERPER_API_KEY);
    if (!SERPER_API_KEY) {
      console.log('❌ DEBUG: No Serper API key - check Render env var "Serper_api"');
      return {
        success: false,
        message: "Search API not configured"
      };
    }
    
    console.log('🔍 DEBUG: Making Serper API call...');
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });

    console.log('🔍 DEBUG: Serper response status:', response.status);
    const data = await response.json();
    console.log('🔍 DEBUG: Serper response data:', JSON.stringify(data, null, 2));
    
    if (data.organic && data.organic.length > 0) {
      const results = data.organic.slice(0, 5).map(result => ({
        title: result.title,
        snippet: result.snippet,
        link: result.link,
        source: result.source
      }));
      
      console.log('✅ DEBUG: Web search successful, returning', results.length, 'results');
      return {
        success: true,
        message: `Found ${results.length} search results for "${query}"`,
        data: { type: 'web_results', query, results }
      };
    } else {
      console.log('❌ DEBUG: No organic results found in response');
      return {
        success: false,
        message: `No search results found for "${query}"`
      };
    }
  } catch (error) {
    console.error('❌ DEBUG: Search error:', error);
    return {
      success: false,
      message: `Search failed: ${error.message}`
    };
  }
}

// Wikipedia summary fetch
async function getWikipediaSummary(query) {
  try {
    const title = encodeURIComponent(query.trim());
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
    if (!res.ok) {
      return { success: false, message: `Wikipedia fetch failed: ${res.status}` };
    }
    const data = await res.json();
    const card = {
      type: 'wiki_card',
      title: data.title,
      extract_html: data.extract_html || data.extract,
      description: data.description,
      thumbnail: data.thumbnail?.source || null,
      canonical_url: data.content_urls?.desktop?.page || data.content_urls?.mobile?.page || null
    };
    return { success: true, message: `Wikipedia: ${data.title}`, data: card };
  } catch (error) {
    return { success: false, message: `Wikipedia error: ${error.message}` };
  }
}

// Serper News search
async function performNewsSearch(query, timeRange = 'week') {
  try {
    const SERPER_API_KEY = process.env.Serper_api;
    if (!SERPER_API_KEY) {
      return { success: false, message: 'Serper API key not configured' };
    }
    const body = { q: query, num: 6, tbs: timeRange === 'day' ? 'qdr:d' : timeRange === 'month' ? 'qdr:m' : 'qdr:w' };
    const res = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const items = (data.news || []).slice(0, 6).map(n => ({
      title: n.title,
      snippet: n.snippet,
      source: n.source,
      date: n.date,
      link: n.link,
      imageUrl: n.imageUrl || null
    }));
    return { success: true, message: `Found ${items.length} news results`, data: { type: 'news_card', items } };
  } catch (error) {
    return { success: false, message: `News search error: ${error.message}` };
  }
}

async function getWeatherData(location) {
  try {
    const WEATHER_API_KEY = process.env.WEATHER_API;
    if (!WEATHER_API_KEY) {
      return {
        success: false,
        message: "Weather API not configured"
      };
    }
    
    const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`);
    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        message: `Weather data not available for ${location}`
      };
    }
    
    return {
      success: true,
      message: `Current weather for ${location}`,
      data: {
        location: data.location.name,
        country: data.location.country,
        temperature_c: data.current.temp_c,
        temperature_f: data.current.temp_f,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        feels_like_c: data.current.feelslike_c
      }
    };
  } catch (error) {
    console.error('Weather error:', error);
    return {
      success: false,
      message: `Weather data unavailable: ${error.message}`
    };
  }
}

// Import the math diagram and image generation functions (these would be moved here)
const { createMathDiagram } = require('./mathDiagrams.cjs');
const { handleImageGeneration } = require('./imageGeneration.cjs');

// Image generation tool handler (for agentic system)
async function handleImageGenerationTool(params) {
  console.log('🔍 IMAGE GENERATION TOOL EXECUTION STARTED');
  console.log('🔍 Input params:', params);
  console.log('🔍 Environment check - Neuraplay API key exists:', !!process.env.Neuraplay);
  
  try {
    const { prompt, style = 'child-friendly', size = '512x512' } = params;
    
    console.log('🎨 Agentic image generation request:', { prompt, style, size });
    console.log('🔍 About to call handleImageGeneration...');
    
    const imageResult = await handleImageGeneration({ prompt, size }, process.env.Neuraplay);
    
    console.log('🔍 handleImageGeneration returned:', {
      success: !!imageResult,
      hasImageUrl: !!(imageResult?.image_url),
      imageUrlType: typeof imageResult?.image_url,
      imageUrlLength: imageResult?.image_url?.length || 0,
      imageUrlStartsWith: imageResult?.image_url?.substring(0, 30) + '...',
      hasContentType: !!(imageResult?.contentType),
      contentType: imageResult?.contentType
    });
    
    const finalResult = {
      success: true,
      message: `🎨 I've created a beautiful ${style} image for you: "${prompt}"`,
      data: { 
        image_url: imageResult.image_url,
        prompt,
        style,
        size
      }
    };
    
    console.log('🔍 Final tool result structure:', {
      success: finalResult.success,
      messageLength: finalResult.message?.length || 0,
      hasData: !!finalResult.data,
      dataKeys: finalResult.data ? Object.keys(finalResult.data) : [],
      dataImageUrlExists: !!(finalResult.data?.image_url),
      dataImageUrlLength: finalResult.data?.image_url?.length || 0
    });
    
    console.log('🔍 IMAGE GENERATION TOOL EXECUTION COMPLETED SUCCESSFULLY');
    return finalResult;
    
  } catch (error) {
    console.error('🔍 IMAGE GENERATION TOOL EXECUTION FAILED');
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    const errorResult = {
      success: false,
      message: `Sorry, I couldn't generate that image: ${error.message}`
    };
    
    console.log('🔍 Error result structure:', errorResult);
    return errorResult;
  }
}

module.exports = {
  tools,
  TOOL_ROUTING_CONFIG,
  SERVER_SIDE_TOOLS,
  executeTool,
  performWebSearch,
  getWeatherData,
  handleImageGenerationTool
};
