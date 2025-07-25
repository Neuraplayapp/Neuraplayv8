import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Data that will be passed up when the game ends
export interface StackerGameData {
  score: number;
  reactionTimes: number[];
}

// Props for the React component
interface StackerGameProps {
  onClose: () => void;
  onGameEnd: (data: StackerGameData) => void;
}

const StackerGame: React.FC<StackerGameProps> = ({ onClose, onGameEnd }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [uiState, setUiState] = useState<'instructions' | 'playing' | 'results'>('instructions');

  // Using useRef for all game-engine variables to prevent re-renders
  const gameCore = useRef({
    camera: null as THREE.OrthographicCamera | null,
    scene: null as THREE.Scene | null,
    renderer: null as THREE.WebGLRenderer | null,
    world: null as CANNON.World | null,
    stack: [] as any[],
    overhangs: [] as any[],
    gameEnded: false,
    autopilot: true,
    lastTime: 0,
    robotPrecision: 0,
    // Data collection for AI
    reactionTimes: [] as number[],
    blockPlacementTime: 0,
  }).current;

  useEffect(() => {
    const boxHeight = 1;
    const originalBoxSize = 3;

    const setRobotPrecision = () => { gameCore.robotPrecision = Math.random() * 1 - 0.5; };

    const init = () => {
      gameCore.autopilot = true;
      gameCore.gameEnded = false;
      gameCore.lastTime = 0;
      gameCore.stack = [];
      gameCore.overhangs = [];
      setRobotPrecision();
      
      gameCore.world = new CANNON.World();
      gameCore.world.gravity.set(0, -10, 0);
      gameCore.world.broadphase = new CANNON.NaiveBroadphase();
      gameCore.world.solver.iterations = 40;

      const aspect = window.innerWidth / window.innerHeight;
      const width = 10;
      const height = width / aspect;
      gameCore.camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0, 100);
      gameCore.camera.position.set(4, 4, 4);
      gameCore.camera.lookAt(0, 0, 0);
      gameCore.scene = new THREE.Scene();

      addLayer(0, 0, originalBoxSize, originalBoxSize);
      addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      gameCore.scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
      dirLight.position.set(10, 20, 0);
      gameCore.scene.add(dirLight);

      gameCore.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      gameCore.renderer.setSize(window.innerWidth, window.innerHeight);
      gameCore.renderer.setClearColor(0x000000, 0);
      if (mountRef.current) mountRef.current.appendChild(gameCore.renderer.domElement);
      gameCore.renderer.setAnimationLoop(animation);
    };
    
    const startGame = () => {
      gameCore.autopilot = false;
      gameCore.gameEnded = false;
      gameCore.lastTime = 0;
      gameCore.stack = [];
      gameCore.overhangs = [];
      gameCore.reactionTimes = [];
      setUiState('playing');
      setScore(0);
      
      if (gameCore.world) {
        while (gameCore.world.bodies.length > 0) gameCore.world.removeBody(gameCore.world.bodies[0]);
      }
      if (gameCore.scene) {
        while(gameCore.scene.children.length > 0) gameCore.scene.remove(gameCore.scene.children[0]);
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        gameCore.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(10, 20, 0);
        gameCore.scene.add(dirLight);
        addLayer(0, 0, originalBoxSize, originalBoxSize);
        addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");
      }
      if (gameCore.camera) {
        gameCore.camera.position.set(4, 4, 4);
        gameCore.camera.lookAt(0, 0, 0);
      }
    };

    const addLayer = (x: number, z: number, width: number, depth: number, direction?: 'x' | 'z') => {
      const y = boxHeight * gameCore.stack.length;
      const layer = generateBox(x, y, z, width, depth, false);
      if (layer) {
        layer.direction = direction;
        gameCore.stack.push(layer);
        if (!gameCore.autopilot) {
          gameCore.blockPlacementTime = performance.now();
        }
      }
    };

    const generateBox = (x: number, y: number, z: number, width: number, depth: number, falls: boolean) => {
      if (!gameCore.scene || !gameCore.world) return null;
      const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
      const color = new THREE.Color(`hsl(${30 + gameCore.stack.length * 4}, 100%, 50%)`);
      const material = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      gameCore.scene.add(mesh);
      const shape = new CANNON.Box(new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2));
      const mass = falls ? 5 : 0;
      const body = new CANNON.Body({ mass, shape });
      body.position.set(x, y, z);
      gameCore.world.addBody(body);
      return { threejs: mesh, cannonjs: body, width, depth, direction: '' };
    };
    
    const cutBox = (topLayer: any, overlap: number, size: number, delta: number) => {
      const direction = topLayer.direction;
      const newWidth = direction === "x" ? overlap : topLayer.width;
      const newDepth = direction === "z" ? overlap : topLayer.depth;
      topLayer.width = newWidth;
      topLayer.depth = newDepth;
      topLayer.threejs.scale[direction] = overlap / size;
      topLayer.threejs.position[direction] -= delta / 2;
      topLayer.cannonjs.position[direction] -= delta / 2;
      const shape = new CANNON.Box(new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2));
      topLayer.cannonjs.shapes = [];
      topLayer.cannonjs.addShape(shape);
    };
    
    const addOverhang = (x: number, z: number, width: number, depth: number) => {
      const y = boxHeight * (gameCore.stack.length - 1);
      const overhang = generateBox(x, y, z, width, depth, true);
      if (overhang) gameCore.overhangs.push(overhang);
    };

    const splitBlockAndAddNextOneIfOverlaps = () => {
      if (gameCore.gameEnded) return;
      const topLayer = gameCore.stack[gameCore.stack.length - 1];
      const previousLayer = gameCore.stack[gameCore.stack.length - 2];
      const direction = topLayer.direction;
      const delta = topLayer.threejs.position[direction] - previousLayer.threejs.position[direction];
      const overhangSize = Math.abs(delta);
      const size = direction === "x" ? topLayer.width : topLayer.depth;
      const overlap = size - overhangSize;
      
      if (overlap > 0) {
        if (!gameCore.autopilot) {
            const reactionTime = performance.now() - gameCore.blockPlacementTime;
            gameCore.reactionTimes.push(reactionTime);
        }
        cutBox(topLayer, overlap, size, delta);
        const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
        const overhangX = direction === "x" ? topLayer.threejs.position.x + overhangShift : topLayer.threejs.position.x;
        const overhangZ = direction === "z" ? topLayer.threejs.position.z + overhangShift : topLayer.threejs.position.z;
        const overhangWidth = direction === "x" ? overhangSize : topLayer.width;
        const overhangDepth = direction === "z" ? overhangSize : topLayer.depth;
        addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);
        const nextX = direction === "x" ? topLayer.threejs.position.x : -10;
        const nextZ = direction === "z" ? topLayer.threejs.position.z : -10;
        const nextDirection = direction === "x" ? "z" : "x";
        setScore(gameCore.stack.length);
        addLayer(nextX, nextZ, topLayer.width, topLayer.depth, nextDirection);
      } else {
        missedTheSpot();
      }
    };

    const missedTheSpot = () => {
      if (gameCore.gameEnded) return;
      const topLayer = gameCore.stack[gameCore.stack.length - 1];
      addOverhang(topLayer.threejs.position.x, topLayer.threejs.position.z, topLayer.width, topLayer.depth);
      gameCore.world?.removeBody(topLayer.cannonjs);
      gameCore.scene?.remove(topLayer.threejs);
      gameCore.gameEnded = true;
      if (!gameCore.autopilot) {
        setUiState('results');
        onGameEnd({ score: score, reactionTimes: gameCore.reactionTimes });
      }
    };
    
    const animation = (time: number) => {
      if (gameCore.lastTime && gameCore.stack.length > 1) {
        const timePassed = time - gameCore.lastTime;
        const speed = 0.008;
        const topLayer = gameCore.stack[gameCore.stack.length - 1];
        const previousLayer = gameCore.stack[gameCore.stack.length - 2];
        const boxShouldMove = !gameCore.gameEnded && (!gameCore.autopilot || (gameCore.autopilot && topLayer.threejs.position[topLayer.direction] < previousLayer.threejs.position[topLayer.direction] + gameCore.robotPrecision));
        if (boxShouldMove) {
          topLayer.threejs.position[topLayer.direction] += speed * timePassed;
          topLayer.cannonjs.position[topLayer.direction] += speed * timePassed;
          if (topLayer.threejs.position[topLayer.direction] > 10) {
            missedTheSpot();
          }
        } else if (gameCore.autopilot) {
          splitBlockAndAddNextOneIfOverlaps();
          setRobotPrecision();
        }
        if (gameCore.camera!.position.y < boxHeight * (gameCore.stack.length - 2) + 4) {
          gameCore.camera!.position.y += speed * timePassed;
        }
        gameCore.world?.step(timePassed / 1000);
        gameCore.overhangs.forEach(element => {
          element.threejs.position.copy(element.cannonjs.position);
          element.threejs.quaternion.copy(element.cannonjs.quaternion);
        });
      }
      gameCore.lastTime = time;
      gameCore.renderer?.render(gameCore.scene!, gameCore.camera!);
    };
    
    const eventHandler = () => {
      if (gameCore.autopilot) startGame();
      else splitBlockAndAddNextOneIfOverlaps();
    };
    
    const handleResize = () => {
      if (!gameCore.renderer || !gameCore.camera) return;
      const aspect = window.innerWidth / window.innerHeight;
      const width = 10;
      const height = width / aspect;
      gameCore.camera.left = width / -2;
      gameCore.camera.right = width / 2;
      gameCore.camera.top = height / 2;
      gameCore.camera.bottom = height / -2;
      gameCore.camera.updateProjectionMatrix();
      gameCore.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    useEffect(() => {
        init();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); eventHandler(); }
            if (e.key === "r" || e.key === "R") { e.preventDefault(); startGame(); }
        };
        window.addEventListener("mousedown", eventHandler);
        window.addEventListener("touchstart", eventHandler);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", handleResize);

        return () => {
            gameCore.renderer?.setAnimationLoop(null);
            if (mountRef.current && gameCore.renderer?.domElement) {
                mountRef.current.removeChild(gameCore.renderer.domElement);
            }
            window.removeEventListener("mousedown", eventHandler);
            window.removeEventListener("touchstart", eventHandler);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
      <div ref={mountRef} className="w-full h-full cursor-pointer bg-slate-800">
        {uiState === 'instructions' && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-center text-white p-8">
            <div>
              <p className="text-2xl font-bold">Stack the Blocks</p>
              <p className="mt-4">Click, tap, or press Space when the moving block is above the stack.</p>
              <p className="mt-8 text-xl animate-pulse">Click anywhere to start</p>
            </div>
          </div>
        )}
        {uiState === 'results' && (
           <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-center text-white p-8">
             <div>
               <p className="text-3xl font-bold">Game Over</p>
               <p className="mt-2 text-xl">Your final score is {score}.</p>
               <button onClick={startGame} className="mt-8 mr-4 bg-green-500 px-6 py-2 rounded-full font-bold">Play Again</button>
               <button onClick={onClose} className="mt-8 bg-violet-600 px-6 py-2 rounded-full font-bold">Close</button>
             </div>
           </div>
        )}
        <div className="absolute top-5 right-5 text-white text-4xl font-black select-none pointer-events-none">{score}</div>
      </div>
    );
};

export default StackerGame; 