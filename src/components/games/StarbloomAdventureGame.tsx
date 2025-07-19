import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Volume2, VolumeX, RotateCcw, Play, Square } from 'lucide-react';

interface Choice {
  text: string;
  nextScene: number;
  prompt: string;
  scaffold?: string;
  moral?: string;
}

interface Task {
  type: string;
  prompt: string;
  answer: string;
}

interface Scene {
  text: string;
  task?: Task;
}

const StarbloomAdventureGame: React.FC = () => {
  const { user, addXP, addStars, updateGameProgress } = useUser();
  const [scene, setScene] = useState(0);
  const [image, setImage] = useState('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  const [choices, setChoices] = useState<Choice[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(0.7);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const scenes: Scene[] = [
    {
      text: "Welcome to Starbloom Forest! You're a young hero in a magical land. Lumina, a wise fairy, says, 'Find the Starbloom Crystal to save the forest!' She gives you three clues: Flower, River, Tree.",
      task: { type: "memory", prompt: "Type the three clues in order (e.g., Flower, River, Tree).", answer: "Flower, River, Tree" }
    },
    {
      text: "A crying creature is lost near the flowers. Helping it might delay your quest.",
      task: { type: "attention", prompt: "What did the creature say it lost?", answer: "Its way home" }
    },
    {
      text: "A rickety bridge blocks your path. Recall the sequence of colored stones to cross: Red, Blue, Yellow.",
      task: { type: "working memory", prompt: "Type the stone sequence.", answer: "Red, Blue, Yellow" }
    },
    {
      text: "You find a bush of glowing berries but meet a hungry squirrel. Sharing might leave you with less energy.",
      task: { type: "executive function", prompt: "Should you share all, some, or none? Explain why.", answer: "Any reasoned response" }
    },
    {
      text: "A hidden path requires you to remember the last three places you visited: Cave, Stream, Hill.",
      task: { type: "STM", prompt: "List the last three places.", answer: "Cave, Stream, Hill" }
    },
    {
      text: "You meet a fox who offers to guide you but wants your shiny gem. Trusting him might be risky.",
      task: { type: "executive function", prompt: "Should you trust the fox? Why?", answer: "Any reasoned response" }
    },
    {
      text: "A puzzle door shows four symbols: Star, Moon, Sun, Cloud. You heard them earlier in a song.",
      task: { type: "working memory", prompt: "Type the symbol sequence.", answer: "Star, Moon, Sun, Cloud" }
    },
    {
      text: "A friend asks you to keep a secret about a broken bridge. Telling the truth might upset them.",
      task: { type: "attention", prompt: "What did your friend ask you to keep secret?", answer: "A broken bridge" }
    },
    {
      text: "You find a map but must recall the last moral choice you made to use it correctly.",
      task: { type: "LTM", prompt: "What was your last moral choice? (e.g., Helped creature)", answer: "Any valid choice" }
    },
    {
      text: "A glowing tree asks you to solve a riddle: Name three animals you saw earlier.",
      task: { type: "STM", prompt: "Name three animals from the story.", answer: "Any three mentioned" }
    },
    // Add more scenes for variety
    {
      text: "You discover a magical pond that reflects your memories. The water shows your journey so far.",
      task: { type: "memory", prompt: "What was the first clue Lumina gave you?", answer: "Flower, River, Tree" }
    },
    {
      text: "A wise owl offers to help if you can remember the sequence of colors from the bridge.",
      task: { type: "working memory", prompt: "What were the bridge stone colors?", answer: "Red, Blue, Yellow" }
    },
    {
      text: "You find a treasure chest but it's locked with a memory puzzle.",
      task: { type: "attention", prompt: "What did the creature lose near the flowers?", answer: "Its way home" }
    },
    {
      text: "A magical door appears, asking about your moral choices in the forest.",
      task: { type: "executive function", prompt: "What was one moral choice you made?", answer: "Any valid choice" }
    },
    {
      text: "The Starbloom Crystal is within reach! But first, prove your memory skills.",
      task: { type: "STM", prompt: "Name the last three places you visited.", answer: "Cave, Stream, Hill" }
    }
  ];

  const synth = window.speechSynthesis;
  let utterance: SpeechSynthesisUtterance | null = null;

  const speak = (text: string) => {
    if (ttsEnabled && synth) {
      setIsSpeaking(true);
      utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = ttsSpeed;
      utterance.pitch = 1.2;
      utterance.onend = () => setIsSpeaking(false);
      synth.speak(utterance);
    } else if (ttsEnabled) {
      setFeedback('Sorry, listening mode is not available in this browser.');
    }
  };

  const stopSpeaking = () => {
    if (synth && synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
    }
  };

  const replayScene = () => {
    stopSpeaking();
    if (scenes[scene]) {
      speak(scenes[scene].text);
      choices.forEach(choice => speak(choice.text));
    }
  };

  const speakChoice = (choiceText: string) => {
    stopSpeaking();
    speak(choiceText);
  };

  const generateChoices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_type: 'text',
          input_data: 'Generate 4-6 age-appropriate (3-12 years) choice options for a fantasy adventure scene in Starbloom Forest. Scene: ' + scenes[scene].text + '. Task: ' + (scenes[scene].task?.prompt || 'None') + '. Include at least one moral dilemma and one option to ask Lumina for a hint. Return choices as a JSON array with "text", "nextScene" (incremental or 0 for hint), "prompt" (for image generation), and optional "scaffold" or "moral" fields.'
        })
      });

      if (!response.ok) {
        console.error('Text generation failed:', response.status);
        setChoices([
          { text: "Continue exploring", nextScene: scene + 1, prompt: "A hero exploring Starbloom Forest, high quality, child-friendly, fantasy style" },
          { text: "Ask Lumina for a hint", nextScene: scene, prompt: "Lumina the fairy in Starbloom Forest, high quality, child-friendly, fantasy style", scaffold: "Lumina says: 'Think about the task carefully!'" }
        ]);
        return;
      }

      const result = await response.json();
      let choices: Choice[];
      
      try {
        const generatedText = result[0]?.generated_text || '';
        // Try to extract JSON from the response
        const jsonMatch = generatedText.match(/\[.*\]/);
        if (jsonMatch) {
          choices = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (e) {
        console.error('Failed to parse choices:', e);
        choices = [
          { text: "Continue exploring", nextScene: scene + 1, prompt: "A hero exploring Starbloom Forest, high quality, child-friendly, fantasy style" },
          { text: "Ask Lumina for a hint", nextScene: scene, prompt: "Lumina the fairy in Starbloom Forest, high quality, child-friendly, fantasy style", scaffold: "Lumina says: 'Think about the task carefully!'" }
        ];
      }

      setChoices(choices.length ? choices : [
        { text: "Continue exploring", nextScene: scene + 1, prompt: "A hero exploring Starbloom Forest, high quality, child-friendly, fantasy style" },
        { text: "Ask Lumina for a hint", nextScene: scene, prompt: "Lumina the fairy in Starbloom Forest, high quality, child-friendly, fantasy style", scaffold: "Lumina says: 'Think about the task carefully!'" }
      ]);
    } catch (error) {
      console.error('Text generation error:', error);
      setChoices([
        { text: "Continue exploring", nextScene: scene + 1, prompt: "A hero exploring Starbloom Forest, high quality, child-friendly, fantasy style" },
        { text: "Ask Lumina for a hint", nextScene: scene, prompt: "Lumina the fairy in Starbloom Forest, high quality, child-friendly, fantasy style", scaffold: "Lumina says: 'Think about the task carefully!'" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async (prompt: string) => {
    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_type: 'image',
          input_data: prompt + ', high quality, detailed, child-friendly, fantasy style, soft lighting, colorful'
        })
      });

      if (!response.ok) {
        console.error('Image generation failed:', response.status);
        return image;
      }

      const result = await response.json();
      if (result.data) {
        return result.data;
      }
      console.warn('Invalid response format:', result);
      return image;
    } catch (error) {
      console.error('Image generation error:', error);
      return image;
    }
  };

  const handleChoice = async (choice: Choice) => {
    stopSpeaking();
    if (choice.scaffold) {
      setFeedback(choice.scaffold);
      speak(choice.scaffold);
    } else {
      setFeedback('');
      const newImage = await generateImage(choice.prompt);
      setImage(newImage);
      const nextScene = choice.nextScene < scenes.length ? choice.nextScene : 0;
      setScene(nextScene);
      setProgress((nextScene / scenes.length) * 100);
      
      // Award XP and stars for progression
      if (user) {
        const xpEarned = 10;
        const starsEarned = nextScene > scene ? 1 : 0;
        
        addXP(xpEarned);
        if (starsEarned > 0) {
          addStars(starsEarned);
        }
        
        // Update game progress
        const currentProgress = user.profile.gameProgress['starbloom-adventure'] || { 
          level: 1, 
          stars: 0, 
          bestScore: 0, 
          timesPlayed: 0 
        };
        
        updateGameProgress('starbloom-adventure', {
          level: Math.max(currentProgress.level, Math.floor(nextScene / 3) + 1),
          stars: currentProgress.stars + starsEarned,
          bestScore: Math.max(currentProgress.bestScore, nextScene),
          timesPlayed: currentProgress.timesPlayed + 1
        });
      }
    }
  };

  const handleTaskSubmit = () => {
    stopSpeaking();
    if (scenes[scene]?.task && userAnswer.toLowerCase() === scenes[scene].task!.answer.toLowerCase()) {
      setFeedback('Great job! You remembered correctly!');
      speak('Great job! You remembered correctly!');
      
      // Award XP for correct task completion
      if (user) {
        addXP(15);
        addStars(1);
      }
    } else {
      setFeedback('Try again! Think about the story details.');
      speak('Try again! Think about the story details.');
    }
  };

  useEffect(() => {
    generateChoices();
    if (ttsEnabled && scenes[scene]) {
      speak(scenes[scene].text);
    }
    return () => stopSpeaking();
  }, [scene, ttsEnabled]);

  if (!scenes[scene]) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: Scene not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-6 gap-6 bg-gradient-to-br from-blue-200 via-purple-100 to-green-200">
      <div className="lg:w-1/4 bg-white rounded-3xl shadow-lg p-4 flex flex-col items-center">
        <h2 className="text-2xl text-purple-600 mb-4">Your Journey</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-gray-600">Progress: {Math.round(progress)}%</p>
      </div>
      
      <div className="lg:w-3/4 bg-white rounded-3xl shadow-lg p-6">
        <h1 className="text-4xl text-purple-600 mb-4 text-center">Starbloom Forest Adventure</h1>
        <img 
          src={`data:image/png;base64,${image}`} 
          alt="Scene" 
          className="w-full h-64 object-cover rounded-lg mb-4" 
        />
        <p className="text-lg text-gray-800 mb-4">{scenes[scene].text}</p>
        
        {scenes[scene].task && (
          <div className="mb-4">
            <p className="text-md text-blue-600">{scenes[scene].task.prompt}</p>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Type your answer"
            />
            <button
              onClick={handleTaskSubmit}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-all duration-300"
            >
              Submit Answer
            </button>
          </div>
        )}
        
        {feedback && <p className="text-md text-purple-600 mb-4">{feedback}</p>}
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-purple-600">Generating choices...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleChoice(choice)}
                onMouseEnter={() => speakChoice(choice.text)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-full hover:scale-105 transition-all duration-300"
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="fixed bottom-6 right-6 bg-white rounded-full shadow-lg p-4 flex flex-col gap-2">
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`p-2 rounded-full transition-all duration-300 ${
            ttsEnabled ? 'bg-yellow-400' : 'bg-gray-300'
          }`}
        >
          {ttsEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
        
        {ttsEnabled && (
          <>
            <button onClick={replayScene} className="p-2 bg-blue-500 rounded-full">
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            <button onClick={stopSpeaking} className="p-2 bg-red-500 rounded-full">
              <Square className="w-6 h-6 text-white" />
            </button>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={ttsSpeed}
              onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
              className="w-20"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default StarbloomAdventureGame; 