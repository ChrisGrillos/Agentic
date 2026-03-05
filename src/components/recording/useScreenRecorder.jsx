/**
 * useScreenRecorder — Active screen recording hook.
 * Uses browser MediaRecorder API (screen capture + optional mic).
 * Returns: { recording, startRecording, stopRecording, videoBlob, videoUrl, error }
 */
import { useState, useRef, useCallback } from "react";

export default function useScreenRecorder() {
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl]   = useState(null);
  const [error, setError]         = useState(null);
  const [duration, setDuration]   = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);
  const timerRef         = useRef(null);
  const startTimeRef     = useRef(null);

  const startRecording = useCallback(async ({ withMic = false } = {}) => {
    setError(null);
    setVideoBlob(null);
    setVideoUrl(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30, displaySurface: "browser" },
        audio: false,
      });

      let finalStream = screenStream;

      if (withMic) {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        if (micStream) {
          const tracks = [...screenStream.getTracks(), ...micStream.getTracks()];
          finalStream = new MediaStream(tracks);
        }
      }

      streamRef.current = finalStream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const recorder = new MediaRecorder(finalStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        setRecording(false);
        clearInterval(timerRef.current);
      };

      // Stop if screen share is cancelled by user
      screenStream.getVideoTracks()[0].addEventListener("ended", () => {
        if (recorder.state !== "inactive") recorder.stop();
      });

      recorder.start(1000); // collect chunks every second
      setRecording(true);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      setError(err.message || "Could not start recording");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    setDuration(d => d); // freeze
  }, []);

  const reset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setDuration(0);
    setError(null);
  }, [videoUrl]);

  return { recording, startRecording, stopRecording, videoBlob, videoUrl, error, duration, reset };
}