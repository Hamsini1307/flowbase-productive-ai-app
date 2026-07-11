import { useState, useRef, useEffect, useCallback } from "react";

export interface UseAssemblyAIStreamingProps {
  onFinalTranscript: (text: string) => void;
}

export function useAssemblyAIStreaming({ onFinalTranscript }: UseAssemblyAIStreamingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    setIsConnecting(false);
    setPartialTranscript("");

    // Stop WebSocket session
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "Terminate" }));
      wsRef.current.close();
    }
    wsRef.current = null;

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop audio processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      await audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    setPartialTranscript("");

    try {
      // 1. Get temporary token from backend
      const tokenRes = await fetch("/api/assemblyai/token", { method: "POST" });
      if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        throw new Error(errorData.error || "Failed to fetch AssemblyAI token");
      }
      const { token } = await tokenRes.json();

      // 2. Request mic permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // 3. Connect WebSocket to AssemblyAI
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?token=${token}&sample_rate=16000&speech_model=universal-3-5-pro`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsRecording(true);

        // 4. Start browser audio capture & downsampling
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass({ sampleRate: 16000 });
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBuffer = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(pcmBuffer.buffer);
            }
          };

          source.connect(processor);
          processor.connect(audioCtx.destination);
        } catch (err: any) {
          console.error("Audio Context setup failed:", err);
          setError("Failed to setup audio capture.");
          void stopRecording();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "Turn") {
            const transcript = data.transcript || "";
            if (data.end_of_turn) {
              setPartialTranscript("");
              if (transcript.trim()) {
                onFinalTranscript(transcript.trim());
              }
            } else {
              setPartialTranscript(transcript);
            }
          } else if (data.type === "Error") {
            console.error("AssemblyAI stream error event:", data);
            setError(data.message || "AssemblyAI streaming error");
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("WebSocket connection error.");
        void stopRecording();
      };

      ws.onclose = () => {
        setIsRecording(false);
        setIsConnecting(false);
        setPartialTranscript("");
      };

    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError(err.message || "Failed to start recording.");
      setIsConnecting(false);
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [onFinalTranscript, stopRecording]);

  useEffect(() => {
    return () => {
      if (wsRef.current || streamRef.current || audioContextRef.current) {
        void stopRecording();
      }
    };
  }, [stopRecording]);

  return {
    isRecording,
    isConnecting,
    partialTranscript,
    error,
    startRecording,
    stopRecording,
  };
}
