import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

type FontSize = "normal" | "large" | "x-large" | "xx-large";

interface AccessibilityContextValue {
  // Font size
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;

  // Text-to-Speech
  ttsEnabled: boolean;
  toggleTTS: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;

  // Voice Recognition
  voiceEnabled: boolean;
  toggleVoice: () => void;
  isListening: boolean;
  lastTranscript: string;

  // High contrast
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

const FONT_SIZES: FontSize[] = ["normal", "large", "x-large", "xx-large"];
const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  normal: "a11y-font-normal",
  large: "a11y-font-large",
  "x-large": "a11y-font-x-large",
  "xx-large": "a11y-font-xx-large",
};

// Voice command definitions
const VOICE_COMMANDS: { patterns: RegExp[]; action: string; description: string }[] = [
  { patterns: [/go\s*(to)?\s*home/i, /home\s*page/i, /landing/i], action: "navigate:/", description: "Go to home page" },
  { patterns: [/go\s*(to)?\s*dashboard/i, /dashboard/i, /my\s*dashboard/i], action: "navigate:/seeker/dashboard", description: "Go to dashboard" },
  { patterns: [/go\s*(to)?\s*profile/i, /my\s*profile/i, /edit\s*profile/i], action: "navigate:/seeker/profile", description: "Go to profile" },
  { patterns: [/go\s*(to)?\s*assessment/i, /take\s*assessment/i, /skill\s*test/i, /assessment/i], action: "navigate:/seeker/assessment", description: "Go to assessments" },
  { patterns: [/go\s*(to)?\s*jobs/i, /browse\s*jobs/i, /find\s*jobs/i, /search\s*jobs/i, /job\s*list/i], action: "navigate:/seeker/jobs", description: "Go to jobs" },
  { patterns: [/log\s*in/i, /sign\s*in/i, /login/i], action: "navigate:/login", description: "Go to login" },
  { patterns: [/register/i, /sign\s*up/i, /create\s*account/i], action: "navigate:/register", description: "Go to register" },
  { patterns: [/log\s*out/i, /sign\s*out/i], action: "logout", description: "Log out" },
  { patterns: [/increase\s*font/i, /bigger\s*(text|font)/i, /larger\s*(text|font)/i, /zoom\s*in/i], action: "font:increase", description: "Increase font size" },
  { patterns: [/decrease\s*font/i, /smaller\s*(text|font)/i, /zoom\s*out/i], action: "font:decrease", description: "Decrease font size" },
  { patterns: [/read\s*(this)?\s*page/i, /read\s*aloud/i, /start\s*reading/i, /read\s*content/i], action: "tts:read-page", description: "Read page content" },
  { patterns: [/stop\s*reading/i, /stop\s*speaking/i, /be\s*quiet/i, /silence/i, /shut\s*up/i], action: "tts:stop", description: "Stop reading" },
  { patterns: [/dark\s*mode/i, /light\s*mode/i, /toggle\s*theme/i, /switch\s*theme/i], action: "theme:toggle", description: "Toggle dark/light mode" },
  { patterns: [/high\s*contrast/i, /toggle\s*contrast/i], action: "contrast:toggle", description: "Toggle high contrast" },
  { patterns: [/scroll\s*down/i, /page\s*down/i], action: "scroll:down", description: "Scroll down" },
  { patterns: [/scroll\s*up/i, /page\s*up/i], action: "scroll:up", description: "Scroll up" },
  { patterns: [/scroll\s*(to)?\s*top/i, /go\s*(to)?\s*top/i], action: "scroll:top", description: "Scroll to top" },
];

export function AccessibilityProvider({
  children,
  onVoiceCommand,
}: {
  children: ReactNode;
  onVoiceCommand?: (action: string, transcript: string) => void;
}) {
  // ─── Font Size ──────────────────────────────
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try {
      return (localStorage.getItem("a11y-font-size") as FontSize) || "normal";
    } catch {
      return "normal";
    }
  });

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    try { localStorage.setItem("a11y-font-size", size); } catch {}
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSizeState((prev) => {
      const idx = FONT_SIZES.indexOf(prev);
      const next = FONT_SIZES[Math.min(idx + 1, FONT_SIZES.length - 1)];
      try { localStorage.setItem("a11y-font-size", next); } catch {}
      return next;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSizeState((prev) => {
      const idx = FONT_SIZES.indexOf(prev);
      const next = FONT_SIZES[Math.max(idx - 1, 0)];
      try { localStorage.setItem("a11y-font-size", next); } catch {}
      return next;
    });
  }, []);

  // Apply font size class to <html>
  useEffect(() => {
    const root = document.documentElement;
    Object.values(FONT_SIZE_CLASSES).forEach((cls) => root.classList.remove(cls));
    root.classList.add(FONT_SIZE_CLASSES[fontSize]);
  }, [fontSize]);

  // ─── High Contrast ──────────────────────────
  const [highContrast, setHighContrast] = useState(() => {
    try { return localStorage.getItem("a11y-high-contrast") === "true"; } catch { return false; }
  });

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => {
      const next = !prev;
      try { localStorage.setItem("a11y-high-contrast", String(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("a11y-high-contrast");
    } else {
      root.classList.remove("a11y-high-contrast");
    }
  }, [highContrast]);

  // ─── Text-to-Speech ─────────────────────────
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    try { return localStorage.getItem("a11y-tts") === "true"; } catch { return false; }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleTTS = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem("a11y-tts", String(next)); } catch {}
      if (!next) {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // Spacebar TTS: read focused element or hovered element
  useEffect(() => {
    if (!ttsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only spacebar, and NOT inside an input/textarea/button
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag)) return;
      // Don't interfere with contenteditable
      if ((e.target as HTMLElement)?.isContentEditable) return;

      e.preventDefault();

      // If already speaking, stop
      if (window.speechSynthesis?.speaking) {
        stopSpeaking();
        return;
      }

      // Read the focused element, or the main content
      const active = document.activeElement as HTMLElement;
      let textToRead = "";

      if (active && active !== document.body && active.textContent) {
        textToRead = active.textContent.trim();
      } else {
        // Read main-content area
        const main = document.getElementById("main-content");
        if (main) {
          textToRead = main.textContent?.trim() || "";
        }
      }

      if (textToRead) {
        // Limit to first ~500 chars for readability
        speak(textToRead.slice(0, 2000));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ttsEnabled, speak, stopSpeaking]);

  // TTS on hover: read element text on focus/hover
  useEffect(() => {
    if (!ttsEnabled) return;

    const handleFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el) return;
      const label =
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.textContent?.trim() ||
        "";
      if (label && label.length < 300) {
        speak(label);
      }
    };

    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, [ttsEnabled, speak]);

  // ─── Voice Recognition ──────────────────────
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const processVoiceCommand = useCallback(
    (transcript: string) => {
      setLastTranscript(transcript);
      const lower = transcript.toLowerCase().trim();

      for (const cmd of VOICE_COMMANDS) {
        for (const pattern of cmd.patterns) {
          if (pattern.test(lower)) {
            const action = cmd.action;

            // Handle built-in actions
            if (action.startsWith("navigate:")) {
              const path = action.replace("navigate:", "");
              window.location.hash = path;
              speak(`Navigating to ${cmd.description.replace("Go to ", "")}`);
              return;
            }
            if (action === "font:increase") {
              increaseFontSize();
              speak("Font size increased");
              return;
            }
            if (action === "font:decrease") {
              decreaseFontSize();
              speak("Font size decreased");
              return;
            }
            if (action === "tts:read-page") {
              const main = document.getElementById("main-content");
              if (main) speak(main.textContent?.trim().slice(0, 2000) || "No content found");
              return;
            }
            if (action === "tts:stop") {
              stopSpeaking();
              return;
            }
            if (action === "contrast:toggle") {
              toggleHighContrast();
              speak("High contrast toggled");
              return;
            }
            if (action === "scroll:down") {
              window.scrollBy({ top: 400, behavior: "smooth" });
              return;
            }
            if (action === "scroll:up") {
              window.scrollBy({ top: -400, behavior: "smooth" });
              return;
            }
            if (action === "scroll:top") {
              window.scrollTo({ top: 0, behavior: "smooth" });
              return;
            }

            // Pass to external handler (theme, logout, etc.)
            if (onVoiceCommand) {
              onVoiceCommand(action, transcript);
            }
            return;
          }
        }
      }

      // No match
      speak(`Sorry, I didn't understand "${transcript}". Try saying "go to dashboard" or "increase font".`);
    },
    [speak, stopSpeaking, increaseFontSize, decreaseFontSize, toggleHighContrast, onVoiceCommand]
  );

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      // Stop
      recognitionRef.current?.stop();
      setVoiceEnabled(false);
      setIsListening(false);
      return;
    }

    // Check support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speak("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        const transcript = last[0].transcript.trim();
        processVoiceCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        speak("Microphone access was denied. Please allow microphone access in your browser settings.");
        setVoiceEnabled(false);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (recognitionRef.current && voiceEnabled) {
        try { recognition.start(); } catch {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    setVoiceEnabled(true);

    try {
      recognition.start();
    } catch (err) {
      speak("Failed to start voice recognition.");
      setVoiceEnabled(false);
    }
  }, [voiceEnabled, processVoiceCommand, speak]);

  // Restart recognition when voiceEnabled changes
  useEffect(() => {
    if (voiceEnabled && recognitionRef.current && !isListening) {
      try { recognitionRef.current.start(); } catch {}
    }
    if (!voiceEnabled && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, [voiceEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        ttsEnabled,
        toggleTTS,
        speak,
        stopSpeaking,
        isSpeaking,
        voiceEnabled,
        toggleVoice,
        isListening,
        lastTranscript,
        highContrast,
        toggleHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return ctx;
}

export { VOICE_COMMANDS };
