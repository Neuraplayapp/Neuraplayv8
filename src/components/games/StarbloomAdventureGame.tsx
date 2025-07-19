import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Volume2, VolumeX, RotateCcw, Play, Square, Brain, Heart, Star, Trophy, Music, Music2, Sparkles, ArrowRight } from 'lucide-react';

interface Choice {
  text: string;
  nextScene: number;
  prompt: string;
  scaffold?: string;
  moral?: string;
  neuropsychologicalConcept?: string;
}

interface GameSession {
  choices: Array<{
    scene: number;
    choice: string;
    moral: string;
    concept: string;
    timestamp: Date;
  }>;
  totalScenes: number;
  completedAt?: Date;
}

interface DynamicScene {
  text: string;
  neuropsychologicalConcept: string;
  choices: Choice[];
  backgroundPrompt: string;
}

const StarbloomAdventureGame: React.FC = () => {
  const { user, updateUser } = useUser();
  const [currentScene, setCurrentScene] = useState(0);
  const [gameSession, setGameSession] = useState<GameSession>({
    choices: [],
    totalScenes: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [dynamicBackground, setDynamicBackground] = useState<string>('');
  const [currentSceneText, setCurrentSceneText] = useState('');
  const [generatedChoices, setGeneratedChoices] = useState<Choice[]>([]);

  // Audio element for background music
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Neuropsychological concepts for randomization
  const neuropsychologicalConcepts = [
    'Working Memory', 'Executive Function', 'Attention Control', 'Cognitive Flexibility',
    'Inhibitory Control', 'Planning', 'Problem Solving', 'Decision Making',
    'Emotional Regulation', 'Social Cognition', 'Theory of Mind', 'Metacognition',
    'Processing Speed', 'Visual Processing', 'Auditory Processing', 'Spatial Reasoning',
    'Verbal Memory', 'Visual Memory', 'Sequential Processing', 'Simultaneous Processing',
    'Fluid Reasoning', 'Crystallized Intelligence', 'Processing Efficiency', 'Cognitive Load',
    'Mental Set', 'Cognitive Bias', 'Heuristic Processing', 'Automatic Processing',
    'Controlled Processing', 'Divided Attention', 'Sustained Attention', 'Selective Attention',
    'Response Inhibition', 'Task Switching', 'Goal Setting', 'Self-Monitoring',
    'Error Detection', 'Feedback Processing', 'Adaptive Behavior', 'Cognitive Strategy'
  ];

  // Initialize game with dynamic content
  useEffect(() => {
    if (currentScene === 0) {
      initializeGame();
    }
  }, []);

  const initializeGame = async () => {
    setIsLoading(true);
    
    // Set initial content immediately
    setCurrentSceneText('Welcome to the Starbloom Forest! Your magical adventure begins...');
    
    try {
      // Generate initial scene with AI (optional)
      const initialScene = await generateDynamicScene(0);
      setCurrentSceneText(initialScene.text);
      setGeneratedChoices(initialScene.choices);
      
      // Generate initial background image (optional)
      const backgroundImage = await generateImage(initialScene.backgroundPrompt);
      if (backgroundImage) {
        setCurrentImage(backgroundImage);
      }
      
      // Generate dynamic background for the game (optional)
      const cosmicBackground = await generateImage('cosmic star field with nebula, deep space, ethereal atmosphere, 4k, detailed');
      if (cosmicBackground) {
        setDynamicBackground(cosmicBackground);
      }
      
      // Start background music
      startBackgroundMusic();
    } catch (error) {
      console.error('Error initializing game:', error);
      // Keep the fallback content that was set above
    } finally {
      setIsLoading(false);
    }
  };

  const generateDynamicScene = async (sceneIndex: number): Promise<DynamicScene> => {
    const randomConcept = neuropsychologicalConcepts[Math.floor(Math.random() * neuropsychologicalConcepts.length)];
    
    // Shorter, more focused prompt for faster generation
    const prompt = `Create a brief fantasy scene (2-3 sentences) for children focusing on ${randomConcept}. Include a specific situation or challenge.`;

    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'story',
          input_data: prompt
        })
      });

      const data = await response.json();
      // Handle different response formats
      const sceneText = data.response || data.data || data[0]?.generated_text || 'A magical adventure unfolds...';

      // Generate contextual choices based on the scene content
      const contextualChoices = await generateContextualChoices(sceneText, randomConcept, sceneIndex);

      return {
        text: sceneText,
        neuropsychologicalConcept: randomConcept,
        choices: contextualChoices,
        backgroundPrompt: `fantasy forest scene, magical atmosphere, ${sceneText.substring(0, 50)}...`
      };
    } catch (error) {
      console.error('Error generating scene:', error);
      return getFallbackScene(sceneIndex, randomConcept);
    }
  };

  const generateContextualChoices = async (sceneText: string, concept: string, sceneIndex: number): Promise<Choice[]> => {
    try {
      // Extract key elements from the scene for more focused choice generation
      const keyElements = extractKeyElements(sceneText);
      
      const prompt = `Based on this scene: "${sceneText}"
      
      Key elements: ${keyElements.join(', ')}
      
      Create 3 specific choices that directly relate to the scene. Make them short and actionable.
      Format: ["choice1", "choice2", "choice3"]`;

      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'text',
          input_data: prompt
        })
      });

      const data = await response.json();
      const responseText = data.response || data.data || data[0]?.generated_text || '';
      
      // Try to parse JSON from response
      try {
        const jsonMatch = responseText.match(/\[.*\]/);
        if (jsonMatch) {
          const parsedChoices = JSON.parse(jsonMatch[0]);
          return parsedChoices.map((choiceText: string, index: number) => ({
            text: choiceText,
            nextScene: sceneIndex + 1,
            prompt: `Continue the story with ${choiceText}`,
            moral: getMoralFromChoice(choiceText),
            neuropsychologicalConcept: concept
          }));
        }
      } catch (e) {
        console.error('Failed to parse choices JSON:', e);
      }

      // Fallback choices based on scene content
      return generateFallbackChoices(sceneText, concept, sceneIndex);
    } catch (error) {
      console.error('Error generating contextual choices:', error);
      return generateFallbackChoices(sceneText, concept, sceneIndex);
    }
  };

  const extractKeyElements = (sceneText: string): string[] => {
    const elements = [];
    
    // Extract characters/creatures
    if (sceneText.includes('forest') || sceneText.includes('tree')) elements.push('forest');
    if (sceneText.includes('creature') || sceneText.includes('animal')) elements.push('creature');
    if (sceneText.includes('magic') || sceneText.includes('spell')) elements.push('magic');
    if (sceneText.includes('path') || sceneText.includes('road')) elements.push('path');
    if (sceneText.includes('light') || sceneText.includes('glow')) elements.push('light');
    if (sceneText.includes('sound') || sceneText.includes('voice')) elements.push('sound');
    if (sceneText.includes('help') || sceneText.includes('save')) elements.push('help');
    if (sceneText.includes('explore') || sceneText.includes('search')) elements.push('explore');
    
    return elements.length > 0 ? elements : ['adventure', 'choice'];
  };

  const getMoralFromChoice = (choiceText: string): string => {
    const lowerChoice = choiceText.toLowerCase();
    
    if (lowerChoice.includes('help') || lowerChoice.includes('save') || lowerChoice.includes('protect')) {
      return 'Empathy and Cooperation';
    } else if (lowerChoice.includes('think') || lowerChoice.includes('plan') || lowerChoice.includes('strategy')) {
      return 'Strategic Thinking';
    } else if (lowerChoice.includes('heart') || lowerChoice.includes('feel') || lowerChoice.includes('trust')) {
      return 'Emotional Intelligence';
    } else if (lowerChoice.includes('explore') || lowerChoice.includes('discover') || lowerChoice.includes('learn')) {
      return 'Curiosity and Learning';
    } else if (lowerChoice.includes('fight') || lowerChoice.includes('defend') || lowerChoice.includes('brave')) {
      return 'Courage and Determination';
    } else {
      return 'Decision Making';
    }
  };

  const generateFallbackChoices = (sceneText: string, concept: string, sceneIndex: number): Choice[] => {
    const lowerText = sceneText.toLowerCase();
    
    // Generate contextual choices based on scene content
    const choices = [];
    
    if (lowerText.includes('forest') || lowerText.includes('tree')) {
      choices.push({
        text: 'Explore deeper into the forest',
        nextScene: sceneIndex + 1,
        prompt: 'Continue exploring the forest',
        moral: 'Curiosity and Learning',
        neuropsychologicalConcept: concept
      });
    }
    
    if (lowerText.includes('creature') || lowerText.includes('animal') || lowerText.includes('help')) {
      choices.push({
        text: 'Help the creature in need',
        nextScene: sceneIndex + 1,
        prompt: 'Continue helping others',
        moral: 'Empathy and Cooperation',
        neuropsychologicalConcept: concept
      });
    }
    
    if (lowerText.includes('magic') || lowerText.includes('spell') || lowerText.includes('mystery')) {
      choices.push({
        text: 'Investigate the magical mystery',
        nextScene: sceneIndex + 1,
        prompt: 'Continue investigating magic',
        moral: 'Strategic Thinking',
        neuropsychologicalConcept: concept
      });
    }
    
    // Add default choices if we don't have enough
    while (choices.length < 3) {
      const defaultChoices = [
        { text: 'Think carefully about your next move', moral: 'Strategic Thinking' },
        { text: 'Follow your instincts', moral: 'Emotional Intelligence' },
        { text: 'Ask for guidance', moral: 'Humility and Learning' }
      ];
      
      const choice = defaultChoices[choices.length];
      choices.push({
        text: choice.text,
        nextScene: sceneIndex + 1,
        prompt: `Continue with ${choice.text}`,
        moral: choice.moral,
        neuropsychologicalConcept: concept
      });
    }
    
    return choices;
  };

  const getFallbackScene = (sceneIndex: number, concept: string): DynamicScene => {
    const scenes = [
      'You discover a glowing crystal in the forest...',
      'A mysterious door appears in the ancient tree...',
      'Starlight guides you to a hidden garden...',
      'Whispers of the wind reveal a secret path...',
      'Moonbeams create a bridge across the river...'
    ];
    
    return {
      text: scenes[sceneIndex % scenes.length],
      neuropsychologicalConcept: concept,
      choices: generateFallbackChoices(scenes[sceneIndex % scenes.length], concept, sceneIndex),
      backgroundPrompt: 'fantasy forest scene, magical atmosphere, glowing crystals'
    };
  };

  const generateImage = async (prompt: string): Promise<string> => {
    try {
      console.log('Generating image for prompt:', prompt);
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'image',
          input_data: prompt
        })
      });

      if (!response.ok) {
        console.error('Image generation failed:', response.status);
        return '';
      }

      const data = await response.json();
      console.log('Image generation response:', data);
      
      // The API returns base64 image data, not image_url
      if (data.data) {
        return `data:image/jpeg;base64,${data.data}`;
      }
      return '';
    } catch (error) {
      console.error('Error generating image:', error);
      return '';
    }
  };

  const startBackgroundMusic = () => {
    if (audioRef.current) {
      audioRef.current.src = '/assets/music/and-just-like-that.mp3';
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(error => {
        console.error('Error playing music:', error);
      });
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play();
        setIsMusicPlaying(true);
      }
    }
  };

  const handleChoice = async (choice: Choice) => {
    setIsLoading(true);
    
    // Record the choice
    const newChoice = {
      scene: currentScene,
      choice: choice.text,
      moral: choice.moral || '',
      concept: choice.neuropsychologicalConcept || '',
      timestamp: new Date()
    };
    
    setGameSession(prev => ({
      ...prev,
      choices: [...prev.choices, newChoice],
      totalScenes: prev.totalScenes + 1
    }));

    // Generate next scene
    const nextScene = await generateDynamicScene(currentScene + 1);
    setCurrentSceneText(nextScene.text);
    setGeneratedChoices(nextScene.choices);
    
    // Generate new image for the choice
    const newImage = await generateImage(nextScene.backgroundPrompt);
    setCurrentImage(newImage);
    
    setCurrentScene(currentScene + 1);
    setIsLoading(false);
  };

  const generateCompletionMessage = async () => {
    const choiceSummary = gameSession.choices.map(choice => 
      `${choice.choice} (${choice.moral})`
    ).join(', ');

    const prompt = `Based on these choices: ${choiceSummary}
    
    Write a brief, encouraging completion message (2-3 sentences) that celebrates their journey and highlights their strengths.`;

    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'text',
          input_data: prompt
        })
      });

      const data = await response.json();
      return data.response || 'Congratulations on completing your magical adventure! Your choices showed great wisdom and heart.';
    } catch (error) {
      console.error('Error generating completion message:', error);
      return 'Congratulations on completing your magical adventure! Your choices showed great wisdom and heart.';
    }
  };

  const completeGame = async () => {
    setIsLoading(true);
    
    // Generate personalized completion message
    const message = await generateCompletionMessage();
    setCompletionMessage(message);
    
    // Save to existing assessment system
    const gameData = {
      gameType: 'StarbloomAdventure',
      choices: gameSession.choices,
      totalScenes: gameSession.totalScenes,
      completedAt: new Date(),
      assessment: {
        moralChoices: gameSession.choices.map(c => c.moral),
        concepts: gameSession.choices.map(c => c.neuropsychologicalConcept),
        completionMessage: message
      }
    };

    // Update user progress with STAR and RANK system
    const starsEarned = Math.min(gameSession.choices.length * 2, 10); // Max 10 stars
    const rankProgress = Math.min(gameSession.choices.length * 5, 100); // Progress toward next rank

    updateUser({
      ...user,
      profile: {
        ...user.profile,
        gameProgress: {
          ...user.profile.gameProgress,
          starbloomAdventure: gameData
        },
        stars: (user.profile.stars || 0) + starsEarned,
        rank: {
          ...user.profile.rank,
          progress: (user.profile.rank?.progress || 0) + rankProgress
        }
      }
    });

    setGameCompleted(true);
    setIsLoading(false);
  };

  if (gameCompleted) {
  return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" 
           style={{ backgroundImage: `url(${dynamicBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-10 max-w-3xl text-center shadow-2xl border border-white/20">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
        </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Adventure Complete
            </h2>
      </div>
      
          <div className="prose prose-lg mx-auto text-gray-700 mb-8">
            <p className="text-xl leading-relaxed font-medium">{completionMessage}</p>
          </div>
          
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Begin New Journey
            </button>
          </div>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900" 
         style={{ backgroundImage: `url(${dynamicBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Audio element for background music */}
      <audio ref={audioRef} preload="auto" />
      
      {/* Music controls */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleMusic}
          className="p-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20"
        >
          {isMusicPlaying ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* Game content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl">
              Starbloom Forest Adventure
            </h1>
            <p className="text-white/80 text-xl drop-shadow-lg font-medium">
              Embark on a journey of discovery and choice
            </p>
          </div>

          {/* Game area */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Image area */}
            <div className="relative">
              {currentImage ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                  <img 
                    src={currentImage} 
                    alt="Adventure scene" 
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-3xl shadow-2xl border border-white/20 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-8xl mb-6 opacity-60">🌲</div>
                    <p className="text-white/80 font-medium text-lg">Enchanted Forest</p>
                  </div>
                </div>
              )}
            </div>

            {/* Story and choices */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6"></div>
                  <p className="text-gray-600 text-lg font-medium">Crafting your adventure...</p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">{currentScene + 1}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        Scene {currentScene + 1}
                      </h3>
                    </div>
                    <div className="prose prose-lg text-gray-700 leading-relaxed">
                      <p className="text-lg">{currentSceneText || 'Welcome to the Starbloom Forest! Your magical adventure begins...'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentScene < 5 ? (
                      // Use generated choices or fallback
                      (generatedChoices.length > 0 ? generatedChoices : [
                        { text: 'Help others first', nextScene: currentScene + 1, prompt: 'Continue helping others', moral: 'Empathy', neuropsychologicalConcept: 'Dynamic Concept' },
                        { text: 'Think carefully', nextScene: currentScene + 1, prompt: 'Continue with planning', moral: 'Strategy', neuropsychologicalConcept: 'Dynamic Concept' },
                        { text: 'Follow your heart', nextScene: currentScene + 1, prompt: 'Continue with emotion', moral: 'Emotional Intelligence', neuropsychologicalConcept: 'Dynamic Concept' }
                      ]).map((choice, index) => (
                        <button
                          key={index}
                          onClick={() => handleChoice(choice)}
                          className="w-full p-6 text-left bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-pink-50 rounded-2xl border border-gray-200 hover:border-purple-300 transition-all duration-300 font-medium text-gray-800 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{choice.text}</span>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                          </div>
            </button>
                      ))
                    ) : (
                      <button
                        onClick={completeGame}
                        className="w-full p-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Complete Your Journey
            </button>
                    )}
                  </div>
          </>
        )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-12 text-center">
            <div className="flex justify-center space-x-3 mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    i <= currentScene ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <p className="text-white/70 text-sm font-medium">
              Journey Progress: {currentScene + 1} of 5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StarbloomAdventureGame; 