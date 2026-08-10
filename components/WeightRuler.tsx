import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

export type WeightRulerProps = {
  min: number;
  max: number;
  step?: number;
  fractionDigits?: number;
  initialValue?: number;
  width: number;
  height?: number;
  indicatorHeight?: number;
  indicatorColor?: string;
  stepWidth?: number;
  gapBetweenSteps?: number;
  shortStepHeight?: number;
  longStepHeight?: number;
  shortStepColor?: string;
  longStepColor?: string;
  onValueChange?: (value: string) => void;
  onValueChangeEnd?: (value: string) => void;
};

export const WeightRuler = ({
  min,
  max,
  step = 0.5,
  fractionDigits = 1,
  initialValue = min,
  width,
  height = 300,
  indicatorHeight = 90,
  indicatorColor = '#111827',
  stepWidth = 2,
  gapBetweenSteps = 10,
  shortStepHeight = 18,
  longStepHeight = 38,
  shortStepColor = '#D1D5DB',
  longStepColor = '#9CA3AF',
  onValueChange,
  onValueChangeEnd,
}: WeightRulerProps) => {
  const interval = stepWidth + gapBetweenSteps;
  const itemCount = Math.round((max - min) / step) + 1;
  const data = useMemo(() => Array.from({ length: itemCount }, (_, i) => i), [itemCount]);

  const clampedIndex = Math.max(
    0,
    Math.min(itemCount - 1, Math.round((initialValue - min) / step))
  );
  const initialDisplayValue = (min + clampedIndex * step).toFixed(fractionDigits);

  const listRef = useRef<FlatList<number>>(null);
  const didInit = useRef(false);
  const lastValue = useRef<string>(initialDisplayValue);

  const rulerCenterY = height / 2;
  const lineTop = rulerCenterY - indicatorHeight / 2;
  const tickBaseline = rulerCenterY + longStepHeight / 2;

  const valueFromIndex = useCallback(
    (index: number) => (min + index * step).toFixed(fractionDigits),
    [min, step, fractionDigits]
  );

  const applyValue = useCallback(
    (value: string) => {
      if (lastValue.current !== value) {
        lastValue.current = value;
        onValueChange?.(value);
      }
    },
    [onValueChange]
  );

  const indexFromOffset = useCallback(
    (offset: number) =>
      Math.max(0, Math.min(itemCount - 1, Math.round(offset / interval))),
    [itemCount, interval]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      applyValue(valueFromIndex(indexFromOffset(event.nativeEvent.contentOffset.x)));
    },
    [applyValue, valueFromIndex, indexFromOffset]
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.x;
      const target = Math.round(offset / interval) * interval;
      if (Math.abs(target - offset) > 1) {
        listRef.current?.scrollToOffset({ offset: target, animated: true });
      }
      const value = valueFromIndex(indexFromOffset(target));
      applyValue(value);
      onValueChangeEnd?.(value);
    },
    [applyValue, valueFromIndex, indexFromOffset, interval, onValueChangeEnd]
  );

  const handleContentSizeChange = useCallback(() => {
    if (didInit.current) return;
    didInit.current = true;
    listRef.current?.scrollToOffset({
      offset: clampedIndex * interval,
      animated: false,
    });
    applyValue(initialDisplayValue);
    onValueChangeEnd?.(initialDisplayValue);
  }, [clampedIndex, interval, applyValue, initialDisplayValue, onValueChangeEnd]);

  const renderItem = useCallback(
    ({ item }: { item: number }) => {
      const isLong = item % 10 === 0;
      const tickHeight = isLong ? longStepHeight : shortStepHeight;
      return (
        <View style={[styles.item, { width: interval, height }]}>
          <View
            style={{
              width: stepWidth,
              height: tickHeight,
              backgroundColor: isLong ? longStepColor : shortStepColor,
              marginTop: tickBaseline - tickHeight,
            }}
          />
        </View>
      );
    },
    [
      interval,
      height,
      stepWidth,
      longStepHeight,
      shortStepHeight,
      tickBaseline,
      longStepColor,
      shortStepColor,
    ]
  );

  const renderSpacer = useCallback(
    () => <View style={{ width: width / 2 - stepWidth / 2 }} />,
    [width, stepWidth]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: interval,
      offset: width / 2 - stepWidth / 2 + index * interval,
      index,
    }),
    [interval, width, stepWidth]
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <FlatList
        ref={listRef}
        data={data}
        horizontal
        keyExtractor={(item) => String(item)}
        renderItem={renderItem}
        ListHeaderComponent={renderSpacer}
        ListFooterComponent={renderSpacer}
        getItemLayout={getItemLayout}
        snapToInterval={interval}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      <View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            left: (width - stepWidth) / 2,
            top: lineTop,
            width: stepWidth,
            height: indicatorHeight,
            backgroundColor: indicatorColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  item: {
    justifyContent: 'flex-start',
  },
  indicator: {
    position: 'absolute',
  },
});
