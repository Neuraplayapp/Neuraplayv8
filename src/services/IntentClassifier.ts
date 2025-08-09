// IntentClassifier.ts - centralizes user intent classification

export type AnalyzedCommand = {
  type: 'navigation' | 'settings' | 'chat' | 'info' | 'agent' | 'game' | 'accessibility' | 'development' | 'content' | 'read';
  action?: any;
};

interface AnalyzeOptions {
  availablePages?: Record<string, any>;
}

export function analyzeCommand(text: string, options: AnalyzeOptions = {}): AnalyzedCommand {
  const lowerText = text.toLowerCase();

  // Accessibility
  const colorBlindnessKeywords = ['color blind', 'colorblind', 'color blindness', "can't see colors", 'trouble with colors', 'colors look the same', 'colors look similar', 'red green', 'blue yellow'];
  if (colorBlindnessKeywords.some(keyword => lowerText.includes(keyword))) {
    return { type: 'accessibility', action: { type: 'color_blindness_support', step: 'initial_assessment', message: '🎨 I can help you with color vision! Let me set up some tests to determine what type of color vision you have and customize NeuraPlay for you.', followUpActions: ['test_colors', 'determine_type', 'implement_settings'] } };
  }

  // Development & learning
  const developmentKeywords = ['help me learn','teach me','improve','get better at','develop','practice','training','struggle with','need help with','want to learn','want to improve','need practice','i\'m bad at','i\'m not good at','i have trouble with','difficulty with','weak at','need to work on','want to master','want to understand','confused about','don\'t understand','hard for me','challenging for me','need improvement','how can i get better at','what can help me with','how do i improve','any tips for','suggestions for','advice for','help with','build skills','develop abilities','strengthen','enhance','boost','work on my','focus on','concentrate on','dedicate time to'];
  const skillKeywords: Record<string, string[]> = {
    math: ['math','mathematics','numbers','counting','addition','subtraction','arithmetic','calculation','multiply','division','fractions','decimals','algebra','geometry','statistics','number sense','math facts','mental math','word problems','equations'],
    reading: ['reading','read','letters','words','spelling','phonics','literacy','vocabulary','comprehension','fluency','decoding','sight words','phonemic awareness','reading comprehension','stories','books','text','writing','grammar'],
    memory: ['memory','remember','forget','concentration','focus','attention','recall','working memory','short term memory','long term memory','memorization','retention','brain training','cognitive','mental','mindfulness'],
    coordination: ['coordination','motor skills','balance','dexterity','hand-eye','fine motor','gross motor','movement','physical','agility','reflexes','body control','hand coordination','eye coordination','spatial awareness'],
    problem_solving: ['problem solving','thinking','logic','puzzles','reasoning','critical thinking','analytical','strategy','planning','decision making','creativity','logical reasoning','deductive reasoning','inductive reasoning'],
    inhibition: ['self control','focus','attention','impulse control','concentration','discipline','patience','waiting','stopping','restraint','regulation','executive function','behavioral control','emotional regulation'],
    spatial: ['spatial','3d','shapes','geometry','visual','patterns','visualization','spatial reasoning','mental rotation','perspective','directions','left and right','up and down','orientation','mapping']
  };
  if (developmentKeywords.some(keyword => lowerText.includes(keyword))) {
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return { type: 'development', action: { skill, request: 'recommend_games', message: `🎮 I have perfect games to help you with ${skill}! Let me show you our specialized activities.` } };
      }
    }
    return { type: 'development', action: { skill: 'general', request: 'assess_needs', message: '🌟 I can help you improve! What specific skills would you like to work on?' } };
  }

  // Content creation
  const creationKeywords = ['create','make','add','write','post','schedule','new'];
  if (creationKeywords.some(k => lowerText.includes(k))) {
    if (lowerText.includes('diary') || lowerText.includes('journal') || lowerText.includes('reflection')) {
      return { type: 'content', action: { type: 'diary', request: 'create_prompt', message: "📝 I'll create a personalized diary prompt for you! Let me set that up." } };
    } else if (lowerText.includes('calendar') || lowerText.includes('event') || lowerText.includes('reminder') || lowerText.includes('schedule')) {
      return { type: 'content', action: { type: 'calendar', request: 'create_entry', message: "📅 I'll help you create a calendar entry! What would you like to schedule?" } };
    } else if (lowerText.includes('forum') || lowerText.includes('discussion') || lowerText.includes('community') || lowerText.includes('post')) {
      return { type: 'content', action: { type: 'forum', request: 'create_post', message: "💬 I'll help you create a forum post! What would you like to discuss?" } };
    }
  }

  // Reading
  const readingKeywords = ['read','show','what\'s in','check','look at','see','view','display'];
  if (readingKeywords.some(k => lowerText.includes(k))) {
    if (lowerText.includes('notification') || lowerText.includes('alert') || lowerText.includes('message')) {
      return { type: 'read', action: { type: 'notifications', message: '🔔 Let me check your notifications for you!' } };
    } else if (lowerText.includes('forum') || lowerText.includes('discussion') || lowerText.includes('community')) {
      return { type: 'read', action: { type: 'forum', message: "💬 I'll show you the latest forum discussions!" } };
    } else if (lowerText.includes('diary') || lowerText.includes('journal') || lowerText.includes('reflection')) {
      return { type: 'read', action: { type: 'diary', message: "📖 Let me show you your diary entries!" } };
    } else if (lowerText.includes('playground') || lowerText.includes('games') || lowerText.includes('activities')) {
      return { type: 'read', action: { type: 'playground', message: "🎮 I'll show you all available games and activities!" } };
    }
  }

  // Agent control
  const agentKeywords = ['ai agent','agent','ai assistant','assistant','brain','synapse','ai teacher','teacher','ai','bot','helper','guide','tutor','smart assistant','virtual assistant','digital assistant','learning assistant','teaching assistant','study buddy','learning companion','ai buddy','virtual teacher','digital teacher','robot teacher','computer teacher','buddy','pal','friend','companion','coach','mentor','advisor'];
  const agentActionKeywords = ['show','open','display','bring','activate','wake','call','summon','appear','come','bring up','pull up','turn on','switch on','fire up','boot up','hide','close','remove','dismiss','stop','disappear','go away','leave','turn off','switch off','shut down','put away','trigger','start','begin','launch','enable','help','assist','support','guide','teach','explain'];
  const hasAgentIntent = (agentKeywords.some(k => lowerText.includes(k)) && agentActionKeywords.some(a => lowerText.includes(a))) || lowerText.includes('ai agent') || lowerText.includes('ai assistant') || lowerText.includes('show agent') || lowerText.includes('hide agent') || lowerText.includes('trigger agent');
  if (hasAgentIntent) {
    if (lowerText.match(/show|open|display|bring|activate|wake|summon|appear|come|help|start/)) {
      return { type: 'agent', action: { command: 'show' } };
    }
    if (lowerText.match(/hide|close|remove|dismiss|stop|go away|leave|disappear/)) {
      return { type: 'agent', action: { command: 'hide' } };
    }
    if (lowerText.match(/trigger|start|begin|launch|activate/)) {
      let triggerType = 'manual';
      if (lowerText.includes('achievement') || lowerText.includes('success') || lowerText.includes('win')) triggerType = 'achievement';
      else if (lowerText.includes('struggle') || lowerText.includes('difficulty') || lowerText.includes('problem') || lowerText.includes('stuck')) triggerType = 'struggle';
      else if (lowerText.includes('milestone') || lowerText.includes('progress') || lowerText.includes('step')) triggerType = 'milestone';
      else if (lowerText.includes('auto') || lowerText.includes('automatic')) triggerType = 'auto';
      else if (lowerText.includes('stuck') || lowerText.includes('repeating')) triggerType = 'stuck';
      else if (lowerText.includes('rapid') || lowerText.includes('fast') || lowerText.includes('quick')) triggerType = 'rapid';
      return { type: 'agent', action: { command: 'trigger', triggerType } };
    }
    const personalityKeywords = ['coach','mentor','friend','analyst','teacher','guide','buddy','pal','instructor','advisor','companion','helper','tutor','trainer'];
    const personality = personalityKeywords.find(k => lowerText.includes(k));
    if (personality) {
      let personalityType = personality;
      if (['teacher','instructor','trainer'].includes(personality)) personalityType = 'coach';
      else if (['guide','advisor'].includes(personality)) personalityType = 'mentor';
      else if (['buddy','pal','companion'].includes(personality)) personalityType = 'friend';
      return { type: 'agent', action: { command: 'personality', personality: personalityType } };
    }
    if (agentKeywords.some(k => lowerText.includes(k))) {
      return { type: 'agent', action: { command: 'show' } };
    }
  }

  // Navigation
  const navigationKeywords = ['go to','take me to','navigate to','open','show me','visit','bring me to','get me to','can you take me to','could you show me','please go to','i want to go to','i need to go to','i would like to go to','can you open','could you open','please open','i want to see','let me see','show me the','i want the','bring up','pull up','load up','switch to','how do i get to','where is the','where can i find','how do i access','i need the','i want to check','i want to look at','let me check','can i see'];
  const hasNavigationKeyword = navigationKeywords.some(k => lowerText.includes(k));
  const directNavigation = lowerText.includes('take me to dashboard') || lowerText.includes('take me to forum') || lowerText.includes('take me to playground') || lowerText.includes('go to dashboard') || lowerText.includes('go to forum') || lowerText.includes('go to playground') || (hasNavigationKeyword && (lowerText.includes('dashboard') || lowerText.includes('forum') || lowerText.includes('playground') || lowerText.includes('profile') || lowerText.includes('settings') || lowerText.includes('about')));
  if (directNavigation) {
    if (lowerText.includes('dashboard')) return { type: 'navigation', action: { path: '/dashboard', page: options.availablePages?.['/dashboard'] } };
    if (lowerText.includes('forum')) return { type: 'navigation', action: { path: '/forum', page: options.availablePages?.['/forum'] } };
    if (lowerText.includes('playground')) return { type: 'navigation', action: { path: '/playground', page: options.availablePages?.['/playground'] } };
    if (lowerText.includes('profile')) return { type: 'navigation', action: { path: '/profile', page: options.availablePages?.['/profile'] } };
    if (lowerText.includes('about')) return { type: 'navigation', action: { path: '/about', page: options.availablePages?.['/about'] } };
    if (lowerText.match(/home|main|landing|homepage/)) return { type: 'navigation', action: { path: '/', page: options.availablePages?.['/'] } };
    if (lowerText.match(/learning central|progress|dashboard|stats|statistics/)) return { type: 'navigation', action: { path: '/dashboard', page: options.availablePages?.['/dashboard'] } };
    if (lowerText.match(/register|sign up|create account/)) return { type: 'navigation', action: { path: '/registration', page: options.availablePages?.['/registration'] } };
    if (lowerText.match(/forum registration|join forum|forum signup/)) return { type: 'navigation', action: { path: '/forum-registration', page: options.availablePages?.['/forum-registration'] } };
    if (lowerText.match(/sign in|login|log in/)) return { type: 'navigation', action: { path: '/signin', page: options.availablePages?.['/signin'] } };
    if (lowerText.match(/ai report|analytics|ai analytics/)) return { type: 'navigation', action: { path: '/ai-report', page: options.availablePages?.['/ai-report'] } };
    if (lowerText.match(/counting|math|numbers/)) return { type: 'navigation', action: { path: '/counting-test', page: options.availablePages?.['/counting-test'] } };
    if (lowerText.match(/test|testing/)) return { type: 'navigation', action: { path: '/test', page: options.availablePages?.['/test'] } };
    if (lowerText.match(/text reveal|animations|text animations/)) return { type: 'navigation', action: { path: '/text-reveal', page: options.availablePages?.['/text-reveal'] } };
    if (lowerText.match(/streaming|demo|streaming demo/)) return { type: 'navigation', action: { path: '/streaming-demo', page: options.availablePages?.['/streaming-demo'] } };
  }

  // Settings
  const settingsKeywords = ['settings','preferences','options','config','setup','configuration','i want to change','how do i change','can i adjust','i need to adjust','i want to customize','how do i customize','can you help me change','open settings','show settings','go to settings','settings menu','preference panel','options menu','configuration panel','where are the settings','how do i configure','where can i change'];
  if (settingsKeywords.some(k => lowerText.includes(k))) return { type: 'settings', action: 'open' };

  const notificationKeywords = ['notifications','alerts','messages','notices','updates','reminders','do i have any messages','any new alerts','what notifications do i have','check my notifications','show my alerts','any new messages','notification center','message center','alert panel','what did i miss','anything new','any updates for me','do i have mail','any new stuff','what\'s new','check notifications','open notifications','show notifications','read my messages','view alerts','see my updates'];
  if (notificationKeywords.some(k => lowerText.includes(k))) {
    if (lowerText.match(/open|show|check|view|see|access/)) return { type: 'settings', action: 'notifications' };
    return { type: 'read', action: { type: 'notifications', message: '🔔 Let me check your notifications for you!' } };
  }

  // Theme
  const themeKeywords = ['dark mode','light mode','dark theme','light theme','night mode','day mode','make it dark','make it light','turn on dark mode','turn off dark mode','switch to dark','switch to light','change to dark','change to light','i want dark mode','i want light mode','i prefer dark','i prefer light','go dark','go light','darker please','lighter please','too bright','too dark','make it darker','make it brighter','it\'s too bright','it\'s too dark','can you make it dark','can you make it light','how do i change the theme','can i switch themes','is there a dark mode','is there a light mode','i like dark themes','i like light themes','dark is better','light is better','my eyes hurt','easier on the eyes','better for reading'];
  const themeActionKeywords = ['make','put','bring','set','change','switch','turn','enable','use','activate','please','can you','could you','i want','i need','i would like'];
  const hasThemeKeyword = themeKeywords.some(k => lowerText.includes(k));
  const hasThemeAction = themeActionKeywords.some(a => lowerText.includes(a)) && (lowerText.includes('dark') || lowerText.includes('light') || lowerText.includes('theme'));
  if (hasThemeKeyword || hasThemeAction) {
    let value = 'auto';
    if (lowerText.match(/dark|night/)) value = 'dark';
    else if (lowerText.match(/light|day|bright/)) value = 'light';
    return { type: 'settings', action: { setting: 'theme', value } };
  }

  // Misc settings
  const fontKeywords = ['font','text size','text','size','bigger','smaller','spacing'];
  const fontActionKeywords = ['make','put','bring','set','change','increase','decrease'];
  if (fontKeywords.some(k => lowerText.includes(k)) || (fontActionKeywords.some(a => lowerText.includes(a)) && lowerText.match(/large|small|big|tiny|wider|spacing/))) {
    let size = 'medium';
    if (lowerText.match(/large|big|bigger|wider/)) size = 'large';
    else if (lowerText.match(/small|tiny|smaller/)) size = 'small';
    return { type: 'settings', action: { setting: 'fontSize', value: size } };
  }
  const animationKeywords = ['animation','motion','effects','transitions'];
  const animationActionKeywords = ['make','put','bring','set','change','enable','disable','turn'];
  if (animationKeywords.some(k => lowerText.includes(k)) || (animationActionKeywords.some(a => lowerText.includes(a)) && lowerText.match(/animation|motion/))) {
    const enabled = !lowerText.match(/disable|off|stop/);
    return { type: 'settings', action: { setting: 'animations', value: enabled ? 'enabled' : 'disabled' } };
  }
  const soundKeywords = ['sound','audio','volume','noise','voice'];
  const soundActionKeywords = ['make','put','bring','set','change','enable','disable','turn','mute'];
  if (soundKeywords.some(k => lowerText.includes(k)) || (soundActionKeywords.some(a => lowerText.includes(a)) && lowerText.match(/sound|audio|voice/))) {
    const enabled = !lowerText.match(/mute|off|disable/);
    return { type: 'settings', action: { setting: 'sound', value: enabled ? 'enabled' : 'disabled' } };
  }

  // Notifications & auto-save settings covered above

  // Info
  if (lowerText.match(/what can you do|help|capabilities/)) return { type: 'info', action: 'capabilities' };
  if (lowerText.match(/where am i|current page/)) return { type: 'info', action: 'location' };

  // Games quick intent
  const gameKeywords = ['game','games','play','playing','activity','activities','exercise','exercises','fun','learning game','educational game','brain game','puzzle','challenge','practice','training','drill','quiz','test','lesson','study game','skill game','something fun','something to do','want to play','need practice','want to learn','help me practice','help me learn','make learning fun','interactive learning','what can i play','what games are there','any fun activities','what\'s available','show me games','recommend a game','suggest an activity','find me something fun','math practice','reading practice','memory training','brain training','cognitive training','counting practice','number games','word games','logic games','pattern games','let\'s play','i\'m bored','something engaging','keep me busy','entertain me','make me smarter','improve my skills','challenge my brain'];
  if (gameKeywords.some(k => lowerText.includes(k))) return { type: 'game', action: { request: 'recommend', message: '🎮 Let me recommend perfect games for you based on your interests!' } };

  return { type: 'chat' };
}

// 🎯 SMART CHART AUTO-CREATION FUNCTION
export function createChartsFromIntent(analyzedCommand: AnalyzedCommand): void {
  if (analyzedCommand.type === 'visualization' && analyzedCommand.charts) {
    // Create charts in priority order with slight delays for smooth UX
    analyzedCommand.charts
      .sort((a, b) => a.priority - b.priority)
      .forEach((chart, index) => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('scribble_chart_create', {
            detail: {
              title: chart.title,
              type: chart.type,
              scenario: chart.scenario,
              series: [],
              metadata: {
                autoGenerated: true,
                priority: chart.priority,
                fromIntent: true
              }
            }
          }));
          
          // Auto-open scribbleboard for first chart
          if (index === 0) {
            window.dispatchEvent(new CustomEvent('scribble_open', {
              detail: { mode: 'fullscreen' }
            }));
          }
        }, index * 500); // Stagger creation
      });
    
    // Start evolution tracking if needed
    if (analyzedCommand.evolution?.track) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('scribble_evolution_start', {
          detail: {
            chartCount: analyzedCommand.charts?.length || 0,
            hasComparison: analyzedCommand.evolution?.compare || false
          }
        }));
      }, (analyzedCommand.charts.length * 500) + 1000);
    }
  }
  
  if (analyzedCommand.type === 'hypothesis') {
    // Auto-create hypothesis workspace
    window.dispatchEvent(new CustomEvent('scribble_open', {
      detail: {
        mode: 'fullscreen',
        prompt: 'Define your research hypothesis...',
        left: 'Approach A: Primary method',
        right: 'Approach B: Alternative method'
      }
    }));
  }
}

// 🔄 EVOLUTION PREFERENCE TRACKING
export function trackEvolutionPreference(chartId: string, interactionType: 'view' | 'interact' | 'modify' | 'dismiss'): void {
  const preferenceScore = {
    'view': 1,
    'interact': 3,
    'modify': 5,
    'dismiss': -2
  }[interactionType];
  
  // Store preference data
  const preferences = JSON.parse(localStorage.getItem('scribble_evolution_preferences') || '{}');
  if (!preferences[chartId]) {
    preferences[chartId] = { score: 0, interactions: [] };
  }
  
  preferences[chartId].score += preferenceScore;
  preferences[chartId].interactions.push({
    type: interactionType,
    timestamp: new Date().toISOString(),
    score: preferenceScore
  });
  
  localStorage.setItem('scribble_evolution_preferences', JSON.stringify(preferences));
  
  // Dispatch evolution event
  window.dispatchEvent(new CustomEvent('scribble_evolution_preference', {
    detail: {
      chartId,
      interactionType,
      newScore: preferences[chartId].score,
      isPreferred: preferences[chartId].score > 5
    }
  }));
}

// 🏆 GET PREFERRED SOLUTION
export function getPreferredSolution(): string | null {
  const preferences = JSON.parse(localStorage.getItem('scribble_evolution_preferences') || '{}');
  const entries = Object.entries(preferences as Record<string, {score: number}>);
  
  if (entries.length === 0) return null;
  
  const preferred = entries.reduce((prev, current) => 
    (current[1].score > prev[1].score) ? current : prev
  );
  
  return preferred[1].score > 5 ? preferred[0] : null;
}

