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
let playbackRequested = false;
let listeners: ((playing: boolean) => void)[] = [];

export function registerSoundCloudWidget(iframe: HTMLIFrameElement, onReady?: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  let cancelled = false;
  let retryTimer: number | null = null;
  let widget: SoundCloudWidget | null = null;

  const init = () => {
    if (cancelled) return;

    if (window.SC && window.SC.Widget) {
      try {
        widget = window.SC.Widget(iframe);
        activeWidget = widget;

        widget.bind(window.SC.Widget.Events.READY, () => {
          if (cancelled || !widget) return;
          isWidgetReady = true;
          widget.setVolume(85);
          if (onReady) onReady();

          if (playbackRequested) {
            widget.play();
          }
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
          playbackRequested = false;
          notifyListeners(false);
        });

        widget.bind(window.SC.Widget.Events.ERROR, () => {
          isWidgetReady = false;
          isTrackPlaying = false;
          notifyListeners(false);
        });
      } catch (err) {
        console.warn("SoundCloud Widget initialization note:", err);
      }
    } else {
      retryTimer = window.setTimeout(init, 300);
    }
  };

  init();

  return () => {
    cancelled = true;
    if (retryTimer !== null) window.clearTimeout(retryTimer);

    if (widget && window.SC?.Widget) {
      widget.unbind(window.SC.Widget.Events.READY);
      widget.unbind(window.SC.Widget.Events.PLAY);
      widget.unbind(window.SC.Widget.Events.PAUSE);
      widget.unbind(window.SC.Widget.Events.FINISH);
      widget.unbind(window.SC.Widget.Events.ERROR);
    }

    if (activeWidget === widget) {
      activeWidget = null;
      isWidgetReady = false;
      isTrackPlaying = false;
    }
  };
}

export function playSoundCloudTrack() {
  playbackRequested = true;
  if (activeWidget && isWidgetReady) {
    activeWidget.play();
  }
}

export function pauseSoundCloudTrack() {
  playbackRequested = false;
  if (activeWidget && isWidgetReady) {
    activeWidget.pause();
  }
}

export function toggleSoundCloudTrack(): boolean {
  if (playbackRequested || isTrackPlaying) {
    pauseSoundCloudTrack();
    return false;
  }

  playSoundCloudTrack();
  return true;
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
