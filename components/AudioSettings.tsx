"use client";

import { Speech, Volume2, VolumeX } from "lucide-react";
import type { AudioPreferences } from "@/lib/game/types";

interface AudioSettingsProps {
  preferences: AudioPreferences;
  onToggleSound: () => void;
  onToggleVoice: () => void;
}

/**
 * Accessible Sound Effects and Voice Announcements toggles with explicit
 * enabled/disabled states and keyboard switch semantics.
 */
export function AudioSettings({
  preferences,
  onToggleSound,
  onToggleVoice,
}: AudioSettingsProps) {
  return (
    <div
      role="group"
      aria-label="Audio preferences"
      className="flex items-center gap-2"
    >
      <button
        type="button"
        role="switch"
        aria-checked={preferences.soundEnabled}
        aria-label="Sound effects"
        data-testid="toggle-sound"
        onClick={onToggleSound}
        className={[
          "tactile-button inline-flex min-h-[38px] items-center gap-2 rounded-[11px] border px-3 py-1.5 text-sm font-medium cursor-pointer",
          preferences.soundEnabled
            ? "border-black/[0.14] bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,22,0.04)]"
            : "border-black/[0.08] bg-surface-subtle text-ink-muted",
        ].join(" ")}
      >
        {preferences.soundEnabled ? (
          <Volume2 aria-hidden="true" className="h-4 w-4 text-ink" />
        ) : (
          <VolumeX aria-hidden="true" className="h-4 w-4 text-ink-muted" />
        )}
        <span>Sound</span>
        <span
          className={[
            "text-xs font-normal",
            preferences.soundEnabled ? "text-ink-secondary" : "text-ink-muted",
          ].join(" ")}
        >
          {preferences.soundEnabled ? "On" : "Off"}
        </span>
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={preferences.voiceEnabled}
        aria-label="Voice announcements"
        data-testid="toggle-voice"
        onClick={onToggleVoice}
        className={[
          "tactile-button inline-flex min-h-[38px] items-center gap-2 rounded-[11px] border px-3 py-1.5 text-sm font-medium cursor-pointer",
          preferences.voiceEnabled
            ? "border-black/[0.14] bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,22,0.04)]"
            : "border-black/[0.08] bg-surface-subtle text-ink-muted",
        ].join(" ")}
      >
        <Speech
          aria-hidden="true"
          className={[
            "h-4 w-4 transition-opacity duration-150",
            preferences.voiceEnabled ? "text-ink opacity-100" : "text-ink-muted opacity-55",
          ].join(" ")}
        />
        <span>Voice</span>
        <span
          className={[
            "text-xs font-normal",
            preferences.voiceEnabled ? "text-ink-secondary" : "text-ink-muted",
          ].join(" ")}
        >
          {preferences.voiceEnabled ? "On" : "Off"}
        </span>
      </button>
    </div>
  );
}
