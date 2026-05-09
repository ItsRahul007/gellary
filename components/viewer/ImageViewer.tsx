import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 6;
const SPRING = { damping: 22, stiffness: 280, mass: 0.6 };

// ─── worklet helpers ──────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
}

/** Max translation before the image edge crosses the viewport edge. */
function maxTranslation(s: number) {
  'worklet';
  return {
    x: Math.max(0, (SCREEN_W * s - SCREEN_W) / 2),
    y: Math.max(0, (SCREEN_H * s - SCREEN_H) / 2),
  };
}

function clamped(tx: number, ty: number, s: number) {
  'worklet';
  const { x, y } = maxTranslation(s);
  return { tx: clamp(tx, -x, x), ty: clamp(ty, -y, y) };
}

// ─── component ────────────────────────────────────────────────────────────────

interface Props { uri: string }

export default function ImageViewer({ uri }: Props) {
  // Committed transform state
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Pinch — captured at gesture start
  const pinchStartScale = useSharedValue(1);
  const pinchStartTx = useSharedValue(0);
  const pinchStartTy = useSharedValue(0);
  const pinchFocalX = useSharedValue(0);
  const pinchFocalY = useSharedValue(0);

  // Pan — captured at gesture start
  const panStartTx = useSharedValue(0);
  const panStartTy = useSharedValue(0);

  // ── pinch ──────────────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      pinchStartScale.value = scale.value;
      pinchStartTx.value = translateX.value;
      pinchStartTy.value = translateY.value;
      // Focal point relative to view centre
      pinchFocalX.value = e.focalX - SCREEN_W / 2;
      pinchFocalY.value = e.focalY - SCREEN_H / 2;
    })
    .onUpdate((e) => {
      const s = clamp(pinchStartScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      scale.value = s;

      // Zoom around the focal point:
      //   tx = focal * (1 - s/s0) + startTx * (s/s0)
      const ratio = s / pinchStartScale.value;
      const rawTx = pinchFocalX.value * (1 - ratio) + pinchStartTx.value * ratio;
      const rawTy = pinchFocalY.value * (1 - ratio) + pinchStartTy.value * ratio;
      const { tx, ty } = clamped(rawTx, rawTy, s);
      translateX.value = tx;
      translateY.value = ty;
    })
    .onEnd(() => {
      if (scale.value < 1.1) {
        scale.value = withSpring(1, SPRING);
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
      } else {
        // Snap translation into bounds in case clamp in onUpdate drifted slightly
        const { tx, ty } = clamped(translateX.value, translateY.value, scale.value);
        translateX.value = withSpring(tx, SPRING);
        translateY.value = withSpring(ty, SPRING);
      }
    });

  // ── pan (1 pointer only, so it won't fire during 2-finger pinch) ───────────
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      panStartTx.value = translateX.value;
      panStartTy.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      const { tx, ty } = clamped(
        panStartTx.value + e.translationX,
        panStartTy.value + e.translationY,
        scale.value,
      );
      translateX.value = tx;
      translateY.value = ty;
    })
    .onEnd(() => {
      // Safety snap — covers edge cases where clamping in onUpdate slightly overshot
      const { tx, ty } = clamped(translateX.value, translateY.value, scale.value);
      translateX.value = withSpring(tx, SPRING);
      translateY.value = withSpring(ty, SPRING);
    });

  // ── double tap (zoom into tap position) ───────────────────────────────────
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e, success) => {
      if (!success) return;
      if (scale.value > 1) {
        scale.value = withSpring(1, SPRING);
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
      } else {
        const target = 3;
        // Zoom into the tapped screen position
        const fx = e.x - SCREEN_W / 2;
        const fy = e.y - SCREEN_H / 2;
        const { tx, ty } = clamped(fx * (1 - target), fy * (1 - target), target);
        scale.value = withSpring(target, SPRING);
        translateX.value = withSpring(tx, SPRING);
        translateY.value = withSpring(ty, SPRING);
      }
    });

  const composed = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="contain"
          transition={150}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
});