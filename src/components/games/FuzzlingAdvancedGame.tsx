import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Minimize2, Maximize2, Music, Volume2, VolumeX, Star, Zap, Heart } from 'lucide-react';

interface FuzzlingAdvancedGameProps {
  onClose: () => void;
}

// Game state interfaces
interface GameState {
  score: number;
  joy: number;
  level: number;
  gameOver: boolean;
  showLevelUp: boolean;
  showGameOver: boolean;
  eventWarning: string;
  showEventWarning: boolean;
}

interface MetaState {
  stardust: number;
  talents: {
    biggerPlaypen: boolean;
    cozyStart: boolean;
    affinityAttunement: boolean;
  };
  cosmetics: {
    availableColors: Record<string, { unlocked: boolean; cost: number }>;
    selectedColor: string;
  };
  selectedFuzzling: 'sunny' | 'dusty';
  musicEnabled: boolean;
}

// Global variables for the game instance
let world: any, particleSystem: any, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
let Box2D: any;
const SCALE = 30; // 30 pixels = 1 meter in Box2D

const FuzzlingAdvancedGame: React.FC<FuzzlingAdvancedGameProps> = ({ onClose }) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const gameLoopRef = useRef<number>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentView, setCurrentView] = useState<'main-menu' | 'game' | 'post-game'>('main-menu');
  const [gameError, setGameError] = useState<string>('');
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    joy: 0,
    level: 1,
    gameOver: false,
    showLevelUp: false,
    showGameOver: false,
    eventWarning: '',
    showEventWarning: false,
  });

  const [metaState, setMetaState] = useState<MetaState>({
    stardust: 0,
    talents: {
      biggerPlaypen: false,
      cozyStart: false,
      affinityAttunement: false,
    },
    cosmetics: {
      availableColors: {
        '#ff5555': { unlocked: true, cost: 0 }, // Default Red
        '#8be9fd': { unlocked: false, cost: 50 }, // Cyan
        '#50fa7b': { unlocked: false, cost: 50 }, // Green
        '#f1fa8c': { unlocked: false, cost: 50 }, // Yellow
        '#bd93f9': { unlocked: false, cost: 50 }, // Purple
        '#ffb86c': { unlocked: false, cost: 50 }, // Orange
      },
      selectedColor: '#ff5555',
    },
    selectedFuzzling: 'sunny',
    musicEnabled: true,
  });

  const JOY_PER_LEVEL = [0, 10, 25, 45, 70, 100, 150, 210, 300];

  // Load saved progress
  useEffect(() => {
    const savedData = localStorage.getItem('fuzzlingAdvancedSave_v3');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setMetaState(prev => ({
        ...prev,
        stardust: parsed.stardust || 0,
        talents: { ...prev.talents, ...parsed.talents },
        cosmetics: { ...prev.cosmetics, ...parsed.cosmetics },
        selectedFuzzling: parsed.selectedFuzzling || 'sunny',
        musicEnabled: parsed.musicEnabled !== undefined ? parsed.musicEnabled : true,
      }));
    }
  }, []);

  const saveProgress = useCallback(() => {
    localStorage.setItem('fuzzlingAdvancedSave_v3', JSON.stringify({
      stardust: metaState.stardust,
      talents: metaState.talents,
      cosmetics: metaState.cosmetics,
      selectedFuzzling: metaState.selectedFuzzling,
      musicEnabled: metaState.musicEnabled,
    }));
  }, [metaState]);

  const purchaseTalent = useCallback((talentName: keyof MetaState['talents'], cost: number) => {
    if (metaState.stardust >= cost && !metaState.talents[talentName]) {
      setMetaState(prev => ({
        ...prev,
        stardust: prev.stardust - cost,
        talents: { ...prev.talents, [talentName]: true }
      }));
    }
  }, [metaState.stardust, metaState.talents]);

  const purchaseColor = useCallback((color: string, cost: number) => {
    if (metaState.stardust >= cost && !metaState.cosmetics.availableColors[color].unlocked) {
      setMetaState(prev => ({
        ...prev,
        stardust: prev.stardust - cost,
        cosmetics: {
          ...prev.cosmetics,
          availableColors: {
            ...prev.cosmetics.availableColors,
            [color]: { ...prev.cosmetics.availableColors[color], unlocked: true }
          }
        }
      }));
    }
  }, [metaState.stardust, metaState.cosmetics.availableColors]);

  const selectColor = useCallback((color: string) => {
    if (metaState.cosmetics.availableColors[color].unlocked) {
      setMetaState(prev => ({
        ...prev,
        cosmetics: { ...prev.cosmetics, selectedColor: color }
      }));
    }
  }, [metaState.cosmetics.availableColors]);

  const selectFuzzling = useCallback((type: 'sunny' | 'dusty') => {
    setMetaState(prev => ({ ...prev, selectedFuzzling: type }));
  }, []);

  const toggleMusic = useCallback(() => {
    setMetaState(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  }, []);

  const endGame = useCallback((score: number) => {
    setCurrentView('post-game');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const stardustEarned = Math.floor(score / 10);
    setMetaState(prev => ({ ...prev, stardust: prev.stardust + stardustEarned }));
    saveProgress();
  }, [saveProgress]);

  const launchGame = useCallback(async (targetElement: HTMLElement) => {
    try {
      setGameError('');
      
      // Load Box2D if not already loaded
      if (!window.box2dwasm) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/box2d-wasm@7.0.0/dist/umd/box2d-wasm.js';
        script.onload = async () => {
          try {
            Box2D = await window.box2dwasm();
            initializeGame(targetElement);
          } catch (error) {
            console.error('Failed to initialize Box2D:', error);
            setGameError('Failed to load physics engine. Please refresh and try again.');
          }
        };
        script.onerror = () => {
          setGameError('Failed to load physics engine. Please check your internet connection.');
        };
        document.head.appendChild(script);
      } else {
        try {
          Box2D = await window.box2dwasm();
          initializeGame(targetElement);
        } catch (error) {
          console.error('Failed to initialize Box2D:', error);
          setGameError('Failed to load physics engine. Please refresh and try again.');
        }
      }
    } catch (error) {
      console.error('Game initialization error:', error);
      setGameError('Failed to start game. Please try again.');
    }
  }, []);

  const initializeGame = useCallback((targetElement: HTMLElement) => {
    try {
      const {
        b2World, b2Vec2, b2BodyDef, b2_dynamicBody, b2PolygonShape,
        b2ParticleSystemDef, b2ParticleGroupDef, b2CircleShape,
        b2_waterParticle, b2_viscousParticle, b2_powderParticle,
        b2ContactListener
      } = Box2D;

      // Clear the container and create canvas
      targetElement.innerHTML = '';
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d')!;
      targetElement.appendChild(canvas);

      // Set canvas size with talent consideration
      const containerRect = targetElement.getBoundingClientRect();
      const gameWidth = containerRect.width * (metaState.talents.biggerPlaypen ? 1.05 : 1);
      canvas.width = gameWidth;
      canvas.height = containerRect.height;

      // World Setup
      const gravity = new b2Vec2(0, 10);
      world = new b2World(gravity);

      // Create Static Boundaries
      const bd = new b2BodyDef();
      const ground = world.CreateBody(bd);
      const wallShape = new b2PolygonShape();
      
      // Floor
      wallShape.SetAsBox(canvas.width / 2 / SCALE, 2);
      ground.CreateFixture(wallShape, 0);
      ground.SetTransform(new b2Vec2(canvas.width / 2 / SCALE, canvas.height / SCALE), 0);
      
      // Left Wall
      wallShape.SetAsBox(1, canvas.height / 2 / SCALE);
      ground.CreateFixture(wallShape, 0);
      ground.SetTransform(new b2Vec2(0, canvas.height / 2 / SCALE), 0);
      
      // Right Wall
      wallShape.SetAsBox(1, canvas.height / 2 / SCALE);
      ground.CreateFixture(wallShape, 0);
      ground.SetTransform(new b2Vec2(canvas.width / SCALE, canvas.height / 2 / SCALE), 0);

      // ADVANCED PHYSICS: FLUID SYSTEM
      const psd = new b2ParticleSystemDef();
      psd.radius = 0.15; // Particle radius in meters
      psd.dampingStrength = 0.2;
      particleSystem = world.CreateParticleSystem(psd);

      // Game state
      let localGameState = {
        score: metaState.talents.cozyStart ? 50 : 0,
        joy: 0,
        level: 1,
        gameOver: false,
        nextBerryTier: 0,
        canDrop: true,
        previewBerry: null as any,
        bodiesToDestroy: [] as any[],
      };

      const BERRIES = [
        { tier: 0, radius: 15, affinity: 'sun', color: '#ff5555', score: 1 },
        { tier: 1, radius: 20, affinity: 'earth', color: '#50fa7b', score: 3 },
        { tier: 2, radius: 28, affinity: 'moon', color: '#bd93f9', score: 6 },
        { tier: 3, radius: 35, affinity: 'sun', color: '#ffb86c', score: 10 },
        { tier: 4, radius: 45, affinity: 'earth', color: '#f1fa8c', score: 15 },
        { tier: 5, radius: 58, affinity: 'moon', color: '#8be9fd', score: 25 },
      ];

      const checkLevelUp = () => {
        if (localGameState.joy >= JOY_PER_LEVEL[localGameState.level]) {
          localGameState.level++;
          setGameState(prev => ({ ...prev, level: localGameState.level, showLevelUp: true }));
          setTimeout(() => setGameState(prev => ({ ...prev, showLevelUp: false })), 2000);
        }
      };

      function createBerry(x: number, y: number, tier: number, isStatic = false, overrideColor = null) {
        const berryData = BERRIES[tier];
        const bd = new b2BodyDef();
        if (!isStatic) bd.set_type(b2_dynamicBody);
        bd.set_position(new b2Vec2(x / SCALE, y / SCALE));
        const body = world.CreateBody(bd);

        const shape = new b2CircleShape();
        shape.set_m_radius(berryData.radius / SCALE);
        const fixture = body.CreateFixture(shape, 1.0);
        
        // Apply dusty fuzzling effect
        if (metaState.selectedFuzzling === 'dusty') {
          fixture.SetFriction(0.1);
        }

        body.userData = { 
          type: 'berry', 
          tier: tier, 
          affinity: berryData.affinity, 
          color: overrideColor || berryData.color, 
          radius: berryData.radius 
        };
        return body;
      }

      function spawnNextBerry() {
        if (localGameState.gameOver) return;
        
        // Affinity Attunement Talent Logic
        if (metaState.talents.affinityAttunement && Math.random() < 0.33) {
          const preferredAffinity = metaState.selectedFuzzling === 'sunny' ? 'sun' : 'earth';
          const affinityBerries = BERRIES.filter(b => b.affinity === preferredAffinity && b.tier < 3);
          const berryData = affinityBerries[Math.floor(Math.random() * affinityBerries.length)];
          localGameState.nextBerryTier = BERRIES.indexOf(berryData);
        } else {
          localGameState.nextBerryTier = Math.floor(Math.random() * 3);
        }

        localGameState.previewBerry = createBerry(canvas.width / 2, 50, localGameState.nextBerryTier, true, metaState.cosmetics.selectedColor);
      }

      function dropBerry(x: number) {
        if (!localGameState.previewBerry) return;
        
        world.DestroyBody(localGameState.previewBerry);
        localGameState.previewBerry = null;
        createBerry(x, 50, localGameState.nextBerryTier);
        setTimeout(() => spawnNextBerry(), 500);
      }

      function createExplosion(x: number, y: number, radius: number, strength: number) {
        const explosionCenter = new b2Vec2(x / SCALE, y / SCALE);
        
        for (let body = world.GetBodyList(); body.a; body = body.GetNext()) {
          if (body.GetType() === b2_dynamicBody) {
            const bodyPos = body.GetPosition();
            const distanceVec = new b2Vec2(bodyPos.x - explosionCenter.x, bodyPos.y - explosionCenter.y);
            const distance = distanceVec.Length();

            if (distance < radius) {
              distanceVec.Normalize();
              distanceVec.set_x(distanceVec.x * strength * (1 - distance / radius));
              distanceVec.set_y(distanceVec.y * strength * (1 - distance / radius));
              body.ApplyLinearImpulse(distanceVec, bodyPos, true);
            }
          }
        }
      }

      function createFluidSplash(x: number, y: number, color: string) {
        const shape = new b2CircleShape();
        shape.set_m_radius(1.5);
        shape.set_m_p(new b2Vec2(x / SCALE, y / SCALE));
        
        const pgd = new b2ParticleGroupDef();
        pgd.shape = shape;
        pgd.flags = b2_viscousParticle;
        const group = particleSystem.CreateParticleGroup(pgd);
        
        setTimeout(() => particleSystem.DestroyParticleGroup(group), 1500);
      }

      function handleMerge(bodyA: any, bodyB: any) {
        const dataA = bodyA.userData;
        const dataB = bodyB.userData;

        // Same-Tier, Same-Affinity Merge
        if (dataA.tier === dataB.tier && dataA.affinity === dataB.affinity) {
          const nextTier = BERRIES.findIndex(b => b.tier > dataA.tier && b.affinity === dataA.affinity);
          if (nextTier !== -1) {
            const posA = bodyA.GetPosition();
            const posB = bodyB.GetPosition();
            const midX = (posA.x + posB.x) / 2 * SCALE;
            const midY = (posA.y + posB.y) / 2 * SCALE;
            
            createBerry(midX, midY, nextTier);
            
            let scoreGain = dataA.tier + 1;
            if (metaState.selectedFuzzling === 'sunny') scoreGain *= 1.1;
            
            localGameState.score += Math.round(scoreGain);
            setGameState(prev => ({ ...prev, score: localGameState.score }));
            
            if (dataA.tier >= 3) createFluidSplash(midX, midY, dataA.color);

            localGameState.bodiesToDestroy.push(bodyA, bodyB);
          }
        }
        // Cross-Affinity Combo: Sun + Moon = Eclipse
        else if ((dataA.affinity === 'sun' && dataB.affinity === 'moon') || 
                 (dataA.affinity === 'moon' && dataB.affinity === 'sun')) {
          const posA = bodyA.GetPosition();
          const posB = bodyB.GetPosition();
          const midX = (posA.x + posB.x) / 2 * SCALE;
          const midY = (posA.y + posB.y) / 2 * SCALE;
          createExplosion(midX, midY, 10, -30);
          localGameState.score += 5;
          setGameState(prev => ({ ...prev, score: localGameState.score }));
          localGameState.bodiesToDestroy.push(bodyA, bodyB);
        }
      }

      function triggerEvent(eventType: string) {
        if (eventType === 'windyDay') {
          setGameState(prev => ({ 
            ...prev, 
            eventWarning: 'WINDY DAY!', 
            showEventWarning: true 
          }));
          
          setTimeout(() => {
            setGameState(prev => ({ ...prev, showEventWarning: false }));
            const wind = (Math.random() > 0.5 ? 1 : -1) * 5;
            world.SetGravity(new b2Vec2(wind, 10));
            
            setTimeout(() => {
              world.SetGravity(new b2Vec2(0, 10));
            }, 15000);
          }, 3000);
        }
      }

      function checkGameOver() {
        for (let body = world.GetBodyList(); body.a; body = body.GetNext()) {
          if (body.userData && body.userData.type === 'berry' && body.GetPosition().y < (100 / SCALE)) {
            if (body.GetLinearVelocity().Length() < 0.1) {
              localGameState.gameOver = true;
              setGameState(prev => ({ ...prev, gameOver: true }));
              return true;
            }
          }
        }
        return false;
      }

      function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render Berries
        for (let body = world.GetBodyList(); body.a; body = body.GetNext()) {
          if (body.userData && body.userData.type === 'berry') {
            const pos = body.GetPosition();
            const angle = body.GetAngle();
            ctx.save();
            ctx.translate(pos.x * SCALE, pos.y * SCALE);
            ctx.rotate(angle);
            ctx.beginPath();
            const shape = body.GetFixtureList().GetShape();
            ctx.arc(0, 0, shape.get_m_radius() * SCALE, 0, 2 * Math.PI);
            ctx.fillStyle = body.userData.color;
            ctx.fill();
            ctx.restore();
          }
        }
        
        // Render Particles
        const particles = particleSystem.GetPositionBuffer();
        ctx.fillStyle = `rgba(0, 150, 255, 0.7)`;
        for (let i = 0; i < particleSystem.GetParticleCount() * 2; i += 2) {
          ctx.beginPath();
          ctx.arc(particles[i] * SCALE, particles[i+1] * SCALE, particleSystem.GetRadius() * SCALE, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      function gameLoop() {
        if (localGameState.gameOver) {
          cancelAnimationFrame(gameLoopRef.current!);
          endGame(localGameState.score);
          return;
        }
        
        world.Step(1 / 60, 8, 3);
        
        localGameState.bodiesToDestroy.forEach(body => world.DestroyBody(body));
        localGameState.bodiesToDestroy = [];
        
        render();
        
        if (checkGameOver()) {
          return;
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }

      // Contact Listener for berry merging
      const listener = new b2ContactListener();
      listener.BeginContact = (contact: any) => {
        const bodyA = contact.GetFixtureA().GetBody();
        const bodyB = contact.GetFixtureB().GetBody();
        if (bodyA.userData && bodyB.userData && bodyA.userData.type === 'berry' && bodyB.userData.type === 'berry') {
          handleMerge(bodyA, bodyB);
        }
      };
      world.SetContactListener(listener);

      // Setup controls
      canvas.addEventListener('click', (e) => {
        if (localGameState.previewBerry) {
          dropBerry(e.offsetX);
        }
      });

      canvas.addEventListener('mousemove', (e) => {
        if (localGameState.previewBerry) {
          localGameState.previewBerry.SetTransform(new b2Vec2(e.offsetX / SCALE, 50 / SCALE), 0);
        }
      });

      // Start game
      spawnNextBerry();
      gameLoop();
      
      // Start event timer
      setTimeout(() => triggerEvent('windyDay'), 20000);
      
    } catch (error) {
      console.error('Game initialization error:', error);
      setGameError('Failed to initialize game. Please try again.');
    }
  }, [metaState, endGame]);

  const shutdownGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    if (world) {
      world = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const startGame = useCallback(() => {
    setCurrentView('game');
    setGameState(prev => ({ 
      ...prev, 
      score: metaState.talents.cozyStart ? 50 : 0,
      joy: 0,
      level: 1,
      gameOver: false,
      showLevelUp: false,
      showGameOver: false,
      eventWarning: '',
      showEventWarning: false,
    }));
    
    if (metaState.musicEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    
    setTimeout(() => {
      if (gameContainerRef.current) {
        launchGame(gameContainerRef.current);
      }
    }, 100);
  }, [metaState, launchGame]);

  const returnToMainMenu = useCallback(() => {
    shutdownGame();
    setCurrentView('main-menu');
    setGameError('');
  }, [shutdownGame]);

  // Save progress when metaState changes
  useEffect(() => {
    saveProgress();
  }, [metaState, saveProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shutdownGame();
    };
  }, [shutdownGame]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-gray-800 rounded-lg shadow-2xl ${isFullscreen ? 'w-full h-full' : 'w-4/5 h-4/5'} relative`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-700 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">Fuzzling's Advanced Playpen</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMusic}
              className="p-2 text-white hover:bg-gray-600 rounded"
            >
              {metaState.musicEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:bg-gray-600 rounded"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-gray-600 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Game Container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Error Display */}
          {gameError && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center z-20">
              <div className="bg-gray-700 p-8 rounded-lg text-center max-w-md">
                <h3 className="text-xl font-bold text-red-400 mb-4">Game Error</h3>
                <p className="text-white mb-6">{gameError}</p>
                <button
                  onClick={returnToMainMenu}
                  className="px-6 py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Return to Menu
                </button>
              </div>
            </div>
          )}

          {/* Main Menu */}
          {currentView === 'main-menu' && !gameError && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center z-10">
              <div className="bg-gray-700 p-8 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
                <h1 className="text-3xl font-bold text-cyan-400 mb-4 text-center">Fuzzling's Advanced Playpen</h1>
                
                {/* Stardust Display */}
                <div className="text-2xl text-yellow-400 mb-6 text-center">
                  <Star className="inline mr-2" />
                  Stardust: {metaState.stardust}
                </div>

                {/* Shop Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Talent Tree */}
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">Talent Tree</h3>
                    <div className="space-y-3">
                      <div className="bg-gray-600 p-4 rounded-lg">
                        <div className="font-bold">Bigger Playpen</div>
                        <div className="text-sm text-gray-300">Cost: 100 Stardust</div>
                        <button
                          onClick={() => purchaseTalent('biggerPlaypen', 100)}
                          disabled={metaState.talents.biggerPlaypen || metaState.stardust < 100}
                          className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          {metaState.talents.biggerPlaypen ? 'Purchased' : 'Purchase'}
                        </button>
                      </div>
                      
                      <div className="bg-gray-600 p-4 rounded-lg">
                        <div className="font-bold">Cozy Start</div>
                        <div className="text-sm text-gray-300">Cost: 250 Stardust</div>
                        <button
                          onClick={() => purchaseTalent('cozyStart', 250)}
                          disabled={metaState.talents.cozyStart || metaState.stardust < 250}
                          className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          {metaState.talents.cozyStart ? 'Purchased' : 'Purchase'}
                        </button>
                      </div>
                      
                      <div className="bg-gray-600 p-4 rounded-lg">
                        <div className="font-bold">Affinity Attunement</div>
                        <div className="text-sm text-gray-300">Cost: 400 Stardust</div>
                        <button
                          onClick={() => purchaseTalent('affinityAttunement', 400)}
                          disabled={metaState.talents.affinityAttunement || metaState.stardust < 400}
                          className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          {metaState.talents.affinityAttunement ? 'Purchased' : 'Purchase'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cosmetics */}
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">Fuzzling Colors</h3>
                    <div className="bg-gray-600 p-4 rounded-lg">
                      <p className="text-sm text-gray-300 mb-3">Unlock new colors for 50 Stardust each.</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(metaState.cosmetics.availableColors).map(([color, data]) => (
                          <div
                            key={color}
                            onClick={() => data.unlocked ? selectColor(color) : purchaseColor(color, data.cost)}
                            className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                              data.unlocked 
                                ? color === metaState.cosmetics.selectedColor 
                                  ? 'border-white scale-110' 
                                  : 'border-transparent hover:border-gray-300'
                                : 'grayscale cursor-not-allowed'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fuzzling Selection */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4 text-center">Choose your Fuzzling:</h3>
                  <div className="flex justify-center gap-4">
                    <div
                      onClick={() => selectFuzzling('sunny')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        metaState.selectedFuzzling === 'sunny' 
                          ? 'border-green-400 bg-gray-600' 
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      <h4 className="font-bold text-center">Sunny Fuzzling</h4>
                      <p className="text-sm text-center text-gray-300">+10% Joy Gain</p>
                    </div>
                    <div
                      onClick={() => selectFuzzling('dusty')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        metaState.selectedFuzzling === 'dusty' 
                          ? 'border-green-400 bg-gray-600' 
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      <h4 className="font-bold text-center">Dusty Fuzzling</h4>
                      <p className="text-sm text-center text-gray-300">Berries are slipperier</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="w-full py-3 bg-pink-500 text-white text-lg font-bold rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Start Game
                </button>
              </div>
            </div>
          )}

          {/* Post Game Screen */}
          {currentView === 'post-game' && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center z-10">
              <div className="bg-gray-700 p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold text-cyan-400 mb-4">Naptime!</h2>
                <h3 className="text-xl text-white mb-2">Final Joy: {gameState.score}</h3>
                <h3 className="text-xl text-yellow-400 mb-6">Stardust Earned: {Math.floor(gameState.score / 10)}</h3>
                <button
                  onClick={returnToMainMenu}
                  className="px-6 py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* In-Game UI */}
          {currentView === 'game' && (
            <>
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-5 text-white text-2xl font-bold">
                Joy: {gameState.score}
              </div>
              
              {gameState.showEventWarning && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-red-500 text-4xl font-bold animate-pulse">
                  {gameState.eventWarning}
                </div>
              )}
            </>
          )}

          {/* Game Canvas Container */}
          <div 
            ref={gameContainerRef} 
            className="w-full h-full bg-gray-900"
          />
        </div>

        {/* Audio Element */}
        <audio 
          ref={audioRef} 
          loop 
          preload="auto"
        >
          <source src="/assets/music/Natural Vibes.mp3" type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
};

export default FuzzlingAdvancedGame; 