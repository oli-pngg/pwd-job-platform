import { useState, useRef, useEffect } from "react";
import { useAccessibility, VOICE_COMMANDS } from "@/contexts/AccessibilityContext";
import {
  Accessibility,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ZoomIn,
  ZoomOut,
  Type,
  Contrast,
  X,
  ChevronUp,
  HelpCircle,
  Square,
} from "lucide-react";

const FONT_SIZE_LABELS: Record<string, string> = {
  normal: "100%",
  large: "125%",
  "x-large": "150%",
  "xx-large": "175%",
};

export function AccessibilityToolbar() {
  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    ttsEnabled,
    toggleTTS,
    isSpeaking,
    stopSpeaking,
    speak,
    voiceEnabled,
    toggleVoice,
    isListening,
    lastTranscript,
    highContrast,
    toggleHighContrast,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowHelp(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowHelp(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const readPage = () => {
    const main = document.getElementById("main-content");
    if (main) {
      speak(main.textContent?.trim().slice(0, 2000) || "No content found on this page.");
    }
  };

  return (
    <div ref={panelRef} className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {/* Voice recognition indicator */}
      {voiceEnabled && isListening && (
        <div
          className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg animate-pulse"
          role="status"
          aria-live="polite"
        >
          <Mic size={12} />
          <span>Listening{lastTranscript ? `: "${lastTranscript}"` : "..."}</span>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg"
          aria-label="Stop reading. Click to stop."
        >
          <Volume2 size={12} className="animate-pulse" />
          <span>Reading aloud...</span>
          <Square size={10} />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl w-72 overflow-hidden"
          role="dialog"
          aria-label="Accessibility settings"
          aria-modal="false"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Accessibility size={16} className="text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">Accessibility</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Show voice commands help"
                title="Voice commands"
              >
                <HelpCircle size={14} />
              </button>
              <button
                onClick={() => { setIsOpen(false); setShowHelp(false); }}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close accessibility panel"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {showHelp ? (
            /* Voice Commands Help */
            <div className="p-4 max-h-80 overflow-y-auto">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
                Voice Commands
              </h3>
              <div className="space-y-2">
                {VOICE_COMMANDS.map((cmd) => (
                  <div key={cmd.action} className="flex items-start gap-2">
                    <span className="text-[10px] text-primary mt-0.5">●</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{cmd.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Say: "{cmd.patterns[0].source.replace(/\\s\*/g, " ").replace(/[\\(\\)\\?\\|\\[\\]\\^\\$\\.]/g, "").replace(/i$/, "").trim()}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-[10px] text-muted-foreground">
                  <strong className="text-foreground">Spacebar</strong> — Press spacebar (outside text fields) to read the focused element or the whole page aloud. Press again to stop.
                </p>
              </div>
            </div>
          ) : (
            /* Controls */
            <div className="p-3 space-y-1">
              {/* Text-to-Speech toggle */}
              <ToolbarButton
                icon={ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                label="Text-to-Speech"
                sublabel={ttsEnabled ? "On — Spacebar reads page" : "Off"}
                active={ttsEnabled}
                onClick={toggleTTS}
                ariaLabel={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
              />

              {/* Read Page button (only if TTS is on) */}
              {ttsEnabled && (
                <button
                  onClick={readPage}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors ml-6 max-w-[calc(100%-1.5rem)]"
                  aria-label="Read entire page content aloud"
                >
                  <Volume2 size={14} aria-hidden="true" />
                  Read Page Aloud
                </button>
              )}

              {/* Voice Recognition */}
              <ToolbarButton
                icon={voiceEnabled ? <Mic size={16} className={isListening ? "text-red-500" : ""} /> : <MicOff size={16} />}
                label="Voice Commands"
                sublabel={voiceEnabled ? (isListening ? "Listening..." : "Starting...") : "Off"}
                active={voiceEnabled}
                onClick={toggleVoice}
                ariaLabel={voiceEnabled ? "Disable voice commands" : "Enable voice commands"}
                pulseWhenActive={isListening}
              />

              {/* Divider */}
              <div className="border-t border-border my-2" role="separator" />

              {/* Font Size */}
              <div className="flex items-center gap-2 px-3 py-2">
                <Type size={16} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground flex-1">Font Size</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={decreaseFontSize}
                    disabled={fontSize === "normal"}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease font size"
                    title="Decrease font size"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span
                    className="text-xs font-mono font-medium text-foreground w-10 text-center tabular-nums"
                    aria-live="polite"
                    aria-label={`Current font size: ${FONT_SIZE_LABELS[fontSize]}`}
                  >
                    {FONT_SIZE_LABELS[fontSize]}
                  </span>
                  <button
                    onClick={increaseFontSize}
                    disabled={fontSize === "xx-large"}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase font size"
                    title="Increase font size"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <ToolbarButton
                icon={<Contrast size={16} />}
                label="High Contrast"
                sublabel={highContrast ? "On" : "Off"}
                active={highContrast}
                onClick={toggleHighContrast}
                ariaLabel={highContrast ? "Disable high contrast" : "Enable high contrast"}
              />
            </div>
          )}

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border bg-muted/20">
            <p className="text-[10px] text-muted-foreground text-center">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono border border-border">Esc</kbd> to close
              {ttsEnabled && (
                <> · <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono border border-border">Space</kbd> to read</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowHelp(false); }}
        className={`
          w-12 h-12 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${isOpen
            ? "bg-primary text-primary-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
          }
          ${voiceEnabled && isListening ? "ring-2 ring-red-400 ring-offset-2 ring-offset-background" : ""}
        `}
        aria-label={isOpen ? "Close accessibility settings" : "Open accessibility settings"}
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
        data-testid="button-accessibility-toolbar"
      >
        {isOpen ? <ChevronUp size={20} /> : <Accessibility size={20} />}
      </button>
    </div>
  );
}

// Individual toolbar button
function ToolbarButton({
  icon,
  label,
  sublabel,
  active,
  onClick,
  ariaLabel,
  pulseWhenActive,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  pulseWhenActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
        ${active
          ? "bg-primary/10 text-primary hover:bg-primary/15"
          : "text-foreground hover:bg-accent"
        }
      `}
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
    >
      <span className={`flex-shrink-0 ${pulseWhenActive && active ? "animate-pulse" : ""}`}>
        {icon}
      </span>
      <span className="flex-1 text-left">
        <span className="font-medium block text-sm leading-tight">{label}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">{sublabel}</span>
      </span>
      {/* Toggle indicator */}
      <div
        className={`w-8 h-[18px] rounded-full flex items-center px-0.5 transition-colors ${
          active ? "bg-primary" : "bg-muted-foreground/30"
        }`}
        aria-hidden="true"
      >
        <div
          className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
            active ? "translate-x-[14px]" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}
