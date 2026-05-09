import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  uri: string;
}

export default function VideoPlayer({ uri }: Props) {
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25; // fire timeUpdate every 250 ms
  });

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        // Duration is only reliable once the video is fully loaded
        setDuration(player.duration ?? 0);
        setIsPlaying(player.playing);
      } else {
        setIsPlaying(false);
      }
    });
    const playingSub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });
    const timeSub = player.addListener('timeUpdate', ({ currentTime: t }) => {
      setCurrentTime(t);
    });

    return () => {
      statusSub.remove();
      playingSub.remove();
      timeSub.remove();
    };
  }, [player]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    showControlsTemporarily();
  }, [player, showControlsTemporarily]);

  const seek = useCallback((progress: number) => {
    const targetTime = progress * (player.duration ?? 1);
    player.currentTime = targetTime;
    showControlsTemporarily();
  }, [player, showControlsTemporarily]);

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <Pressable style={styles.container} onPress={showControlsTemporarily}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />

      {showControls && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.controls}>
          {/* Play/Pause */}
          <Pressable onPress={togglePlay} style={styles.playBtn}>
            <Ionicons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={72}
              color="white"
            />
          </Pressable>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

            {/* Progress bar */}
            <Pressable
              style={styles.progressBar}
              onPress={(e) => {
                const { locationX } = e.nativeEvent;
                // approximate progress from touch X
                const barWidth = SCREEN_W - 120;
                seek(Math.min(1, Math.max(0, locationX / barWidth)));
              }}
            >
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
              </View>
            </Pressable>

            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    opacity: 0.9,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    minWidth: 38,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    paddingVertical: 10,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#fff',
    marginLeft: -6.5,
  },
});
