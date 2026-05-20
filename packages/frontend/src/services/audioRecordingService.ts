// Audio recording service for voice commentary on video frames

export interface AudioCommentary {
  id: string;
  audioBlob: Blob;
  startTime: number;
  endTime: number;
  duration: number;
  waveformData?: number[];
  transcription?: string;
  volume: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private videoCurrentTime: number = 0;
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;

  // Initialize audio recording
  async initializeRecording(): Promise<void> {
    try {
      // Request microphone permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      console.log('🎤 Microphone access granted');

      // Setup audio context for visualization
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      source.connect(this.analyser);
      
      this.analyser.fftSize = 256;
      
    } catch (error) {
      console.error('❌ Failed to access microphone:', error);
      throw new Error('Microphone access denied. Please allow microphone access to record commentary.');
    }
  }

  // Start recording at current video time
  startRecording(videoCurrentTime: number): void {
    if (!this.audioStream) {
      throw new Error('Audio stream not initialized');
    }

    this.videoCurrentTime = videoCurrentTime;
    this.startTime = Date.now();
    this.recordedChunks = [];

    // Setup MediaRecorder
    this.mediaRecorder = new MediaRecorder(this.audioStream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    console.log('🎙️ Recording started at video time:', videoCurrentTime);
  }

  // Stop recording and return audio commentary
  async stopRecording(): Promise<AudioCommentary> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          const endTime = Date.now();
          const duration = (endTime - this.startTime) / 1000; // Duration in seconds

          const commentary: AudioCommentary = {
            id: `commentary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            audioBlob,
            startTime: this.videoCurrentTime,
            endTime: this.videoCurrentTime + duration,
            duration,
            volume: 1.0
          };

          // Generate waveform data
          commentary.waveformData = await this.generateWaveform(audioBlob);

          console.log('✅ Recording completed:', {
            duration: commentary.duration,
            startTime: commentary.startTime,
            endTime: commentary.endTime
          });

          resolve(commentary);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // Pause recording
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      console.log('⏸️ Recording paused');
    }
  }

  // Resume recording
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      console.log('▶️ Recording resumed');
    }
  }

  // Get current recording state
  getRecordingState(): RecordingState {
    const isRecording = this.mediaRecorder?.state === 'recording';
    const isPaused = this.mediaRecorder?.state === 'paused';
    const currentTime = this.mediaRecorder ? (Date.now() - this.startTime) / 1000 : 0;
    
    return {
      isRecording,
      isPaused,
      currentTime,
      duration: currentTime,
      volume: this.getCurrentVolume()
    };
  }

  // Get current microphone volume level for visualization
  getCurrentVolume(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    return average / 255; // Normalize to 0-1
  }

  // Generate waveform data for visualization
  private async generateWaveform(audioBlob: Blob): Promise<number[]> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0); // Use first channel
      const samples = 100; // Number of waveform points
      const blockSize = Math.floor(channelData.length / samples);
      const waveformData: number[] = [];

      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let sum = 0;

        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j]);
        }

        waveformData.push(sum / blockSize);
      }

      return waveformData;
    } catch (error) {
      console.warn('Could not generate waveform:', error);
      return [];
    }
  }

  // Create audio URL for playback
  createAudioUrl(audioBlob: Blob): string {
    return URL.createObjectURL(audioBlob);
  }

  // Play audio commentary
  async playCommentary(commentary: AudioCommentary): Promise<void> {
    const audio = new Audio(this.createAudioUrl(commentary.audioBlob));
    audio.volume = commentary.volume;
    
    try {
      await audio.play();
      console.log('🔊 Playing commentary');
    } catch (error) {
      console.error('Failed to play commentary:', error);
    }
  }

  // Cleanup resources
  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.mediaRecorder = null;
    this.analyser = null;
    this.audioContext = null;
    
    console.log('🧹 Audio recording service cleaned up');
  }

  // Check if recording is supported
  isRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  // Get available audio input devices
  async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return [];
    }
  }
}

export const audioRecordingService = new AudioRecordingService();