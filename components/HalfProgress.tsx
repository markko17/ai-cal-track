import Colors from "@/constants/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
    progress: number;     // 0 → 1
    size?: number;
    strokeWidth?: number;
    segments?: number;
    gapAngle?: number;
    value?: number | string;
    label?: string;
    showFlame?: boolean;
    activeColor?: string;
    inactiveColor?: string;
};

export function SegmentedHalfCircleProgress30({
    progress,
    size = 290,
    strokeWidth = 46,
    segments = 14,
    gapAngle = 5,
    value,
    label = "Remaining",
    showFlame = true,
    activeColor = "#111827",
    inactiveColor = "#E5E7EB",
}: Props) {
    const clamped = Math.max(0, Math.min(1, progress));

    const radius = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;

    const totalAngle = 180;
    const effectiveGap = Math.min(gapAngle, totalAngle / Math.max(segments - 1, 1));
    const totalGap = effectiveGap * (segments - 1);

    const segmentAngle = (totalAngle - totalGap) / segments;

    const activeSegments = Math.round(clamped * segments);

    const polarToCartesian = (angle: number) => {
        const rad = (Math.PI / 180) * angle;
        return {
            x: cx + radius * Math.cos(rad),
            y: cy - radius * Math.sin(rad),
        };
    };

    const createArc = (startAngle: number, endAngle: number) => {
        const start = polarToCartesian(startAngle);
        const end = polarToCartesian(endAngle);

        return `
      M ${start.x} ${start.y}
      A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}
    `;
    };

    let currentAngle = 180;

    return (
        <View style={{ width: size, height: size / 2 + 15, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Svg width={size} height={size / 2 + 4}>
                {Array.from({ length: segments }).map((_, i) => {
                    const start = currentAngle;
                    const end = currentAngle - segmentAngle;
                    currentAngle = end - effectiveGap;

                    const isActive = i < activeSegments;

                    return (
                        <Path
                            key={i}
                            d={createArc(start, end)}
                            stroke={isActive ? activeColor : inactiveColor}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeLinecap="butt"
                        />
                    );
                })}
            </Svg>
            <View style={styles.textOverlay}>
                {showFlame && <Text style={styles.flameEmoji}>🔥</Text>}
                {value !== undefined && <Text style={styles.mainText}>{value}</Text>}
                {label !== undefined && <Text style={styles.subText}>{label}</Text>}
            </View>
        </View>
    );
}

export default SegmentedHalfCircleProgress30;

const styles = StyleSheet.create({
    textOverlay: {
        position: 'absolute',
        bottom: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flameEmoji: {
        fontSize: 22,
        marginBottom: 2,
    },
    mainText: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    subText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginTop: 2,
    }
});
