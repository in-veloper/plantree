import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadow } from 'react-native-shadow-2';

import { colors, font, radius, shadowProps } from './theme';

// 실제로 손가락으로 위아래 굴려서 값을 고르는 휠 피커 — 가운데 칸에 멈추게
// snapToInterval 로 스냅시키고, 스크롤이 끝난 위치로 값을 계산한다.
const WHEEL_ITEM_H = 40;
const WHEEL_VISIBLE = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_H * WHEEL_VISIBLE;
const WHEEL_PAD = WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2);

export function WheelPicker({ values, value, onChange, format, width = 64 }) {
  const scrollRef = useRef(null);
  const draggingRef = useRef(false);
  const index = Math.max(0, values.indexOf(value));

  useEffect(() => {
    if (draggingRef.current) return;
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_H, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function commit(offsetY) {
    const i = Math.max(0, Math.min(values.length - 1, Math.round(offsetY / WHEEL_ITEM_H)));
    if (values[i] !== value) onChange(values[i]);
  }

  return (
    <View style={[wheel.root, { width, height: WHEEL_HEIGHT }]}>
      <View pointerEvents="none" style={wheel.highlight} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          draggingRef.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          // snapToInterval 이 있으면 관성 없이 딱 놓아도 스냅 위치로 미끄러지는
          // 움직임 자체가 momentum 으로 잡혀서 이 이벤트가 항상 온다.
          draggingRef.current = false;
          commit(e.nativeEvent.contentOffset.y);
        }}
        contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
      >
        {values.map((v) => (
          <View key={v} style={wheel.item}>
            <Text style={wheel.itemText}>{format ? format(v) : v}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const wheel = StyleSheet.create({
  root: { overflow: 'hidden' },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2),
    height: WHEEL_ITEM_H,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
  },
  item: { height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: {
    fontFamily: font.bold,
    fontSize: 20,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});

// 시계 다이얼 방식 시간 스테퍼 — 한 번 누르면 한 칸, 누르고 있으면 빠르게
// 계속 올라간다(시계 앱들의 표준 동작). 처음엔 살짝 뜸을 두고(400ms),
// 그 다음부턴 빠르게(80ms) 반복한다.
function useHoldRepeat(onTick) {
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const clear = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  }, []);

  const start = useCallback(() => {
    onTickRef.current();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => onTickRef.current(), 80);
    }, 400);
  }, []);

  useEffect(() => clear, [clear]);

  return { onPressIn: start, onPressOut: clear };
}

function StepButton({ direction, onStep }) {
  const hold = useHoldRepeat(onStep);
  return (
    <Pressable {...hold} hitSlop={12} style={({ pressed }) => [stepper.btn, pressed && stepper.btnPressed]}>
      <Ionicons name={direction === 'up' ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textDim} />
    </Pressable>
  );
}

export function Stepper({ value, onChange, format, step = 1, wrap, big }) {
  return (
    <View style={stepper.root}>
      <StepButton direction="up" onStep={() => onChange(wrap(value + step))} />
      <Text style={[stepper.value, big && stepper.valueBig]}>{format(value)}</Text>
      <StepButton direction="down" onStep={() => onChange(wrap(value - step))} />
    </View>
  );
}

const stepper = StyleSheet.create({
  root: { alignItems: 'center' },
  btn: { padding: 6, borderRadius: radius.sm },
  btnPressed: { backgroundColor: colors.surfaceSoft },
  value: {
    fontFamily: font.bold,
    color: colors.text,
    fontSize: 26,
    letterSpacing: -0.5,
    minWidth: 46,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  valueBig: { fontSize: 38, minWidth: 62 },
});

export function Sheet({ visible, title, onClose, children }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [keyboard, setKeyboard] = useState(0);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboard(e.endCoordinates?.height || 0)
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  const dismissRef = useRef(null);
  dismissRef.current = () => {
    Animated.timing(translateY, {
      toValue: 800,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      closeRef.current?.();
    });
  };

  const drag = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.7 || Math.abs(g.dy) < 6) {
          dismissRef.current();
          return;
        }
        Animated.spring(translateY, { toValue: 0, useNativeDriver: false, bounciness: 2 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: false, bounciness: 2 }).start();
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              marginBottom: keyboard,
              maxHeight: keyboard > 0 ? '60%' : '88%',
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.dragZone} {...drag.panHandlers}>
            <View style={styles.grabber} />
          </View>

          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle} numberOfLines={1}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.textDim} />
            </Pressable>
          </View>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function Button({ label, onPress, variant = 'primary', icon, disabled }) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        btn.base,
        isPrimary && btn.primary,
        variant === 'soft' && btn.soft,
        isDanger && btn.danger,
        disabled && btn.disabled,
        pressed && !disabled && btn.pressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={17}
          color={isPrimary || isDanger ? colors.onAccent : colors.accent}
          style={{ marginRight: 7 }}
        />
      ) : null}
      <Text
        style={[
          btn.label,
          (isPrimary || isDanger) && { color: colors.onAccent },
          variant === 'soft' && { color: colors.accent },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({ label, active, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        chip.base,
        active && { backgroundColor: color || colors.accent, borderColor: color || colors.accent },
      ]}
    >
      <Text style={[chip.label, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ style, innerStyle, children }) {
  return (
    <Shadow {...shadowProps} stretch containerStyle={style} style={[card.base, innerStyle]}>
      {children}
    </Shadow>
  );
}

const styles = StyleSheet.create({
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 18, 32, 0.42)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  dragZone: { alignItems: 'center', paddingVertical: 10 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { flex: 1, marginRight: 12, fontFamily: font.bold, fontSize: 18, color: colors.text },
});

const btn = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
  },
  primary: { backgroundColor: colors.accent },
  soft: { backgroundColor: colors.accentSoft },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: { fontFamily: font.semibold, fontSize: 15, color: colors.text },
});

const chip = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  label: { fontFamily: font.semibold, fontSize: 13, color: colors.textDim },
});

const card = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
});
