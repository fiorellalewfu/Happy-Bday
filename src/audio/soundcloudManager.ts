// SoundCloud Widget API manager for Jonathan's real track (JONAMS - Sunday Session VIII)

declare global {
  interface Window {
    SC?: {
      Widget: {
        (element: HTMLIFrameElement | string): SoundCloudWidget;
        Events: {
          LOAD_PROGRESS: string;
          PLAY_PROGRESS: string;
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          SEEK: string;
          READY: string;
          ERROR: string;
        };
      };
    };
  }
}

export interface SoundCloudWidget {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  getVolume: (callback: (volume: number) => void) => void;
  bind: (eventName: string, listener: (data?: any) => void) => void;
  unbind: (eventName: string) => void;
  isPaused: (callback: (paused: boolean) => void) => void;
}

export interface TrackMeta {
  title: string;
  artist: string;
  artwork: string;
  url: string;
}

export const JONAMS_TRACK_META: TrackMeta = {
  title: "Sunday Session VIII",
  artist: "JONAMS",
  artwork: "https://i1.sndcdn.com/artworks-xMv6mzKiXzs13RLU-v4tLaA-t500x500.jpg",
  url: "https://soundcloud.com/sundaystgo/sunday-session-viii-jonams"
};

let activeWidget: SoundCloudWidget | null = null;
let isWidgetReady = false;
let isTrackPlaying = false;
let listeners: ((playing: boolean) => void)[] = [];

export function registerSoundCloudWidget(iframe: HTMLIFrameElement, onReady?: () => void) {
  if (typeof window === 'undefined') return;

  const init = () => {
    if (window.SC && window.SC.Widget) {
      try {
        const widget = window.SC.Widget(iframe);
        activeWidget = widget;

        widget.bind(window.SC.Widget.Events.READY, () => {
          isWidgetReady = true;
          widget.setVolume(85);
          if (onReady) onReady();
        });

        widget.bind(window.SC.Widget.Events.PLAY, () => {
          isTrackPlaying = true;
          notifyListeners(true);
        });

        widget.bind(window.SC.Widget.Events.PAUSE, () => {
          isTrackPlaying = false;
          notifyListeners(false);
        });

        widget.bind(window.SC.Widget.Events.FINISH, () => {
          isTrackPlaying = false;
          notifyListeners(false);
        });
      } catch (err) {
        console.warn("SoundCloud Widget initialization note:", err);
      }
    } else {
      setTimeout(init, 300);
    }
  };

  init();
}

export function playSoundCloudTrack() {
  if (activeWidget && isWidgetReady) {
    activeWidget.play();
    isTrackPlaying = true;
    notifyListeners(true);
  }
}

export function pauseSoundCloudTrack() {
  if (activeWidget && isWidgetReady) {
    activeWidget.pause();
    isTrackPlaying = false;
    notifyListeners(false);
  }
}

export function toggleSoundCloudTrack(): boolean {
  if (activeWidget && isWidgetReady) {
    if (isTrackPlaying) {
      activeWidget.pause();
    } else {
      activeWidget.play();
    }
    return !isTrackPlaying;
  }
  return false;
}

export function setSoundCloudVolume(volume: number) {
  if (activeWidget && isWidgetReady) {
    activeWidget.setVolume(Math.max(0, Math.min(100, volume)));
  }
}

export function isSoundCloudPlaying(): boolean {
  return isTrackPlaying;
}

export function onSoundCloudPlayStateChange(listener: (playing: boolean) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function notifyListeners(playing: boolean) {
  listeners.forEach(fn => fn(playing));
}
