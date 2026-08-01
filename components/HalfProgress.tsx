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
    gapAngle = 4,
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

    const safeSegments = Math.max(1, Math.floor(segments || 14));

    const totalAngle = 180;
    const maxTotalGap = totalAngle * 0.4;
    const maxGapPerSegment = maxTotalGap / Math.max(safeSegments - 1, 1);
    const effectiveGap = Math.min(Math.max(0, gapAngle), maxGapPerSegment);
    const totalGap = effectiveGap * (safeSegments - 1);

    const segmentAngle = (totalAngle - totalGap) / safeSegments;

    const activeSegments = Math.round(clamped * safeSegments);

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
      A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}
    `;
    };

    let currentAngle = 180;
    const svgHeight = size / 2 + strokeWidth / 2 + 4;

    return (
        <View style={{ width: size, height: svgHeight, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Svg width={size} height={svgHeight}>
                {Array.from({ length: safeSegments }).map((_, i) => {
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
        bottom: 8,
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
