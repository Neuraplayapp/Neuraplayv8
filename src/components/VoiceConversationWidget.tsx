import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { WebSocketService } from '../services/WebSocketService';
import { useTheme } from '../contexts/ThemeContext';

interface VoiceConversationWidgetProps {
  onConversationStart?: () => void;
  onConversationEnd?: () => void;
  onMessage?: (message: { text: string; isUser: boolean; timestamp: Date }) => void;
  onError?: (error: string) => void;
  className?: string;
}

const VoiceConversationWidget: React.FC<VoiceConversationWidgetProps> = ({
  onConversationStart,
  onConversationEnd,
  onMessage,
  onError,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  const wsService = useRef<WebSocketService>(WebSocketService.getInstance());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setConnectionStatus('connecting');
        await wsService.current.connect();
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Connect to ElevenLabs
        wsService.current.send({
          type: 'connect_elevenlabs'
        });
      } catch (error) {
        console.error('❌ Failed to connect to WebSocket:', error);
        setConnectionStatus('error');
        onError?.('Failed to connect to voice service');
      }
    };

    initializeConnection();

    // Set up WebSocket event listeners
    const handleMessage = (data: any) => {
      console.log('📥 Voice widget received:', data.type);
      
      if (data.type === 'ai_response' && data.text) {
        onMessage?.({
          text: data.text,
          isUser: false,
          timestamp: new Date()
        });
      }
      
      if (data.type === 'audio_chunk' && data.audio && !isMuted) {
        playBase64Audio(data.audio);
      }
      
      if (data.type === 'audio_ack') {
        setIsProcessing(false);
      }
    };

    const handleError = (error: any) => {
      console.error('❌ WebSocket error in voice widget:', error);
      setConnectionStatus('error');
      onError?.('Voice connection error');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      stopRecording();
    };

    wsService.current.on('message', handleMessage);
    wsService.current.on('error', handleError);
    wsService.current.on('disconnected', handleDisconnected);

    return () => {
      wsService.current.off('message', handleMessage);
      wsService.current.off('error', handleError);
      wsService.current.off('disconnected', handleDisconnected);
      stopRecording();
    };
  }, [isMuted, onMessage, onError]);

  // Play base64 audio
  const playBase64Audio = useCallback((base64Audio: string) => {
    if (isMuted) return;
    
    try {
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i);
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play().catch(error => {
        console.error('❌ Error playing audio:', error);
      });
    } catch (error) {
      console.error('❌ Error processing audio:', error);
    }
  }, [isMuted]);

  // Start recording
  const startRecording = async () => {
    if (!isConnected) {
      onError?.('Not connected to voice service');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      streamRef.current = stream;

      // Use supported MIME type
      const supportedMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = null;
      for (const mimeType of supportedMimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      const mediaRecorder = selectedMimeType ? 
        new MediaRecorder(stream, { mimeType: selectedMimeType }) :
        new MediaRecorder(stream);
        
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const actualMimeType = selectedMimeType || mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: actualMimeType });
        
        if (audioBlob.size > 0) {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          setIsProcessing(true);
          
          // Send audio to server
          wsService.current.send({
            type: 'audio_chunk',
            audio: base64Audio
          });
        }
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        onError?.('Recording failed');
        setIsRecording(false);
      };
      
      // Start recording
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      onConversationStart?.();
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      onError?.('Failed to access microphone');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    onConversationEnd?.();
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Get status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`voice-conversation-widget ${className}`}>
      <div className={`relative p-8 rounded-2xl backdrop-blur-md border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-black/20 border-white/10' 
          : 'bg-white/20 border-black/10'
      }`}>
        
        {/* Connection Status */}
        <div className="flex items-center justify-center mb-6">
          <div className={`flex items-center space-x-2 text-sm ${getStatusColor()}`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionStatus === 'error' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span>
              {connectionStatus === 'connected' ? 'Voice Ready' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection Error' :
               'Disconnected'}
            </span>
          </div>
        </div>

        {/* Main Voice Interface */}
        <div className="flex flex-col items-center space-y-6">
          
          {/* Large Voice Button */}
          <button
            onClick={toggleRecording}
            disabled={connectionStatus !== 'connected' || isProcessing}
            className={`relative w-32 h-32 rounded-full border-4 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-500 border-red-400 animate-pulse shadow-lg shadow-red-500/50'
                : connectionStatus === 'connected'
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 hover:shadow-lg hover:shadow-purple-500/50'
                : 'bg-gray-500 border-gray-400'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Mic className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-white'}`} />
            )}
          </button>

          {/* Status Text */}
          <div className="text-center">
            <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {isProcessing ? 'Processing...' :
               isRecording ? '🎤 Listening... (Click to stop)' :
               connectionStatus === 'connected' ? '🎤 Click to start voice chat' :
               connectionStatus === 'connecting' ? 'Connecting to voice service...' :
               'Voice service unavailable'}
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Speak naturally with your AI teacher
            </p>
          </div>

          {/* Controls */}
          <div className="flex space-x-4">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-all duration-200 ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              title={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceConversationWidget;
