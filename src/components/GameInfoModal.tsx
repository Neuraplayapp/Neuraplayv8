import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Info, Star, Brain, BarChart3, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import './GameInfoModal.css';

export interface GameInfo {
  id: string;
  title: string;
  category: string;
  description: string;
  skills: string[];
  difficulty: string;
  duration: string;
  ageRange: string;
  image: string;
  features: string[];
  instructions: string;
}

interface GameInfoModalProps {
  game: GameInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: () => void;
}

type ModalView = 'default' | 'play' | 'about' | 'statistics';

export default function GameInfoModal({ game, isOpen, onClose, onPlay }: GameInfoModalProps) {
  const { user } = useUser();
  const contentRef = useRef<HTMLDivElement>(null);
  const [modalView, setModalView] = useState<ModalView>('default');
  const [rippleEffect, setRippleEffect] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModalView('default');
    }
  }, [isOpen, game]);

  if (!game || !isOpen) return null;

  // Fallback stats
  const stats = {
    level: 0,
    stars: 0,
    bestScore: 0,
    timesPlayed: 0,
    playTime: 0,
    ...(user?.profile?.gameProgress?.[game.id] || {})
  };

  const handleRipple = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setRippleEffect({ x, y });
    setTimeout(() => setRippleEffect(null), 600);
  };

  const handlePlayClick = () => {
    setModalView('play');
  };

  const handleAboutClick = () => {
    setModalView('about');
  };

  const handleStatisticsClick = () => {
    setModalView('statistics');
  };

  const handleCloseExpanded = () => {
    setModalView('default');
  };

  const handleCloseModal = () => {
    setModalView('default');
    onClose();
  };

  const handleStartGame = () => {
    onPlay();
    handleCloseModal();
  };

  // Determine if overlay is open
  const isOverlayOpen = modalView !== 'default';

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 30,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring" as const, 
        stiffness: 400, 
        damping: 25,
        duration: 0.5
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  const textRevealVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut" as const
      }
    })
  };

  const rippleVariants = {
    initial: { scale: 0, opacity: 1 },
    animate: { 
      scale: 4, 
      opacity: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
        >
          <div className="game-info-modal">
            <main>
              <div className="content-wrapper">
                <motion.div 
                  className={`content${isOverlayOpen ? ' active' : ''}`} 
                  ref={contentRef}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className={`main-content${isOverlayOpen ? ' blurred' : ''}`}>
                    {/* Close button with ripple */}
                    <motion.button 
                      onClick={handleCloseModal}
                      className="modal-close-button"
                      aria-label="Close modal"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={handleRipple}
                    >
                      <X size={24} className="text-white" />
                      {rippleEffect && (
                        <motion.div
                          className="ripple-effect"
                          initial="initial"
                          animate="animate"
                          variants={rippleVariants}
                          style={{
                            left: rippleEffect.x,
                            top: rippleEffect.y,
                          }}
                        />
                      )}
                    </motion.button>

                    <div className="photo-wrapper">
                      <motion.img 
                        className="photo" 
                        src={game.image} 
                        alt={game.title}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>

                    <div className="main-info">
                      <motion.div 
                        className="title-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <h1>{game.title}</h1>
                        <div className="title-info">
                          <p className="light">{game.category}</p>
                          <div className="divider"></div>
                          <p className="light">{game.difficulty}</p>
                          <div className="divider"></div>
                          <p className="light">{game.duration}</p>
                        </div>
                      </motion.div>

                      <div className="songs">
                        {/* Play Game Card */}
                        <motion.div 
                          className="song-card"
                          onClick={handlePlayClick}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onMouseDown={handleRipple}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          <div className="card-content">
                            <div className="card-icon">
                              <Play size={32} className="text-white" />
                            </div>
                            <div className="card-text">
                              <p className="bold">Play Game</p>
                              <p className="light">Start playing now</p>
                            </div>
                            <ChevronRight size={24} className="text-white/60" />
                          </div>
                          {rippleEffect && (
                            <motion.div
                              className="ripple-effect"
                              initial="initial"
                              animate="animate"
                              variants={rippleVariants}
                              style={{
                                left: rippleEffect.x,
                                top: rippleEffect.y,
                              }}
                            />
                          )}
                        </motion.div>

                        {/* About Card */}
                        <motion.div 
                          className="song-card"
                          onClick={handleAboutClick}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onMouseDown={handleRipple}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          <div className="card-content">
                            <div className="card-icon">
                              <Info size={32} className="text-white" />
                            </div>
                            <div className="card-text">
                              <p className="bold">About</p>
                              <p className="light">Game information</p>
                            </div>
                            <ChevronRight size={24} className="text-white/60" />
                          </div>
                        </motion.div>

                        {/* Statistics Card */}
                        <motion.div 
                          className="song-card"
                          onClick={handleStatisticsClick}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onMouseDown={handleRipple}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                        >
                          <div className="card-content">
                            <div className="card-icon">
                              <BarChart3 size={32} className="text-white" />
                            </div>
                            <div className="card-text">
                              <p className="bold">Statistics</p>
                              <p className="light">Your progress</p>
                            </div>
                            <ChevronRight size={24} className="text-white/60" />
                          </div>
                        </motion.div>

                        {/* Stats Cards */}
                        <motion.div 
                          className="stats-grid"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                        >
                          <div className="stat-card">
                            <div className="stat-value">{stats.level}</div>
                            <div className="stat-label">Level</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">{stats.stars}</div>
                            <div className="stat-label">Stars</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">{stats.bestScore}</div>
                            <div className="stat-label">Best Score</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-value">{stats.timesPlayed}</div>
                            <div className="stat-label">Played</div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Expanding Overlays */}
                  <AnimatePresence>
                    {isOverlayOpen && (
                      <motion.div 
                        className="modal-overlay open"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 30,
                          duration: 0.4
                        }}
                      >
                        {modalView === 'play' && (
                          <motion.div 
                            className="overlay-card play-card"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <div className="overlay-header">
                              <div className="header-content">
                                <Brain size={24} className="text-white/60" />
                                <h2>Play Game</h2>
                              </div>
                              <motion.button
                                onClick={handleCloseExpanded}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="close-overlay-btn"
                              >
                                <X size={24} className="text-white" />
                              </motion.button>
                            </div>

                            <div className="overlay-content">
                              <motion.div 
                                className="game-info-section"
                                custom={0}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Skills Developed</h3>
                                <p>{game.skills.join(', ')}</p>
                              </motion.div>

                              <motion.div 
                                className="game-info-section"
                                custom={1}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Description</h3>
                                <p>{game.description}</p>
                              </motion.div>

                              <motion.div 
                                className="game-info-section"
                                custom={2}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Features</h3>
                                <p>{game.features.join(', ')}</p>
                              </motion.div>

                              <motion.div 
                                className="game-info-section"
                                custom={3}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>How to Play</h3>
                                <p>{game.instructions}</p>
                              </motion.div>

                              <motion.div 
                                className="play-button-section"
                                custom={4}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <motion.button 
                                  onClick={handleStartGame}
                                  className="play-button"
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  onMouseDown={handleRipple}
                                >
                                  <Play size={24} className="text-white" />
                                  <span>Start Game</span>
                                  {rippleEffect && (
                                    <motion.div
                                      className="ripple-effect"
                                      initial="initial"
                                      animate="animate"
                                      variants={rippleVariants}
                                      style={{
                                        left: rippleEffect.x,
                                        top: rippleEffect.y,
                                      }}
                                    />
                                  )}
                                </motion.button>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}

                        {modalView === 'about' && (
                          <motion.div 
                            className="overlay-card about-card"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <div className="overlay-header">
                              <div className="header-content">
                                <Info size={24} className="text-white/60" />
                                <h2>About</h2>
                              </div>
                              <motion.button
                                onClick={handleCloseExpanded}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="close-overlay-btn"
                              >
                                <X size={24} className="text-white" />
                              </motion.button>
                            </div>

                            <div className="overlay-content">
                              <motion.div 
                                className="about-section"
                                custom={0}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Description</h3>
                                <p>{game.description}</p>
                              </motion.div>

                              <motion.div 
                                className="about-section"
                                custom={1}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Skills Developed</h3>
                                <p>{game.skills.join(', ')}</p>
                              </motion.div>

                              <motion.div 
                                className="about-section"
                                custom={2}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Features</h3>
                                <p>{game.features.join(', ')}</p>
                              </motion.div>

                              <motion.div 
                                className="about-section"
                                custom={3}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>How to Play</h3>
                                <p>{game.instructions}</p>
                              </motion.div>

                              <motion.div 
                                className="about-section"
                                custom={4}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Game Details</h3>
                                <div className="game-details-grid">
                                  <div className="detail-item">
                                    <span className="detail-label">Category:</span>
                                    <span className="detail-value">{game.category}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Difficulty:</span>
                                    <span className="detail-value">{game.difficulty}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Duration:</span>
                                    <span className="detail-value">{game.duration}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Age Range:</span>
                                    <span className="detail-value">{game.ageRange}</span>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}

                        {modalView === 'statistics' && (
                          <motion.div 
                            className="overlay-card stats-card"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <div className="overlay-header">
                              <div className="header-content">
                                <BarChart3 size={24} className="text-white/60" />
                                <h2>Statistics</h2>
                              </div>
                              <motion.button
                                onClick={handleCloseExpanded}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="close-overlay-btn"
                              >
                                <X size={24} className="text-white" />
                              </motion.button>
                            </div>

                            <div className="overlay-content">
                              <motion.div 
                                className="stats-section"
                                custom={0}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Your Progress</h3>
                                <div className="stats-grid-large">
                                  <motion.div 
                                    className="stat-card-large"
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    <div className="stat-value-large">{stats.level}</div>
                                    <div className="stat-label-large">Current Level</div>
                                  </motion.div>
                                  <motion.div 
                                    className="stat-card-large"
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    <div className="stat-value-large">{stats.stars}</div>
                                    <div className="stat-label-large">Stars Earned</div>
                                  </motion.div>
                                  <motion.div 
                                    className="stat-card-large"
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    <div className="stat-value-large">{stats.bestScore}</div>
                                    <div className="stat-label-large">Best Score</div>
                                  </motion.div>
                                  <motion.div 
                                    className="stat-card-large"
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    <div className="stat-value-large">{stats.timesPlayed}</div>
                                    <div className="stat-label-large">Times Played</div>
                                  </motion.div>
                                  <motion.div 
                                    className="stat-card-large"
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    <div className="stat-value-large">{Math.round(stats.playTime / 60)}m</div>
                                    <div className="stat-label-large">Total Play Time</div>
                                  </motion.div>
                                </div>
                              </motion.div>

                              <motion.div 
                                className="game-info-section"
                                custom={1}
                                variants={textRevealVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <h3>Game Information</h3>
                                <div className="game-info-grid">
                                  <div className="info-item">
                                    <span className="info-label">Category:</span>
                                    <span className="info-value">{game.category}</span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">Difficulty:</span>
                                    <span className="info-value">{game.difficulty}</span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">Skills:</span>
                                    <span className="info-value">{game.skills.join(', ')}</span>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 