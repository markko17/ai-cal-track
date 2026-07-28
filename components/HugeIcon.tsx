import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import Colors from '../constants/colors';

interface HugeIconProps {
  name: string;
  size?: number;
  color?: string;
}

export default function HugeIcon({ name, size = 24, color = Colors.primary }: HugeIconProps) {

  // Fallback to Expo Vector Icons mapped cleanly to HugeIcon concepts
  let ioniconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';

  switch (name.toLowerCase()) {
    case 'male':
      ioniconName = 'male-outline';
      break;
    case 'female':
      ioniconName = 'female-outline';
      break;
    case 'genderother':
    case 'user':
      ioniconName = 'person-outline';
      break;
    case 'flame':
    case 'fire':
    case 'loseweight':
      ioniconName = 'flame-outline';
      break;
    case 'scale':
    case 'maintain':
      ioniconName = 'fitness-outline';
      break;
    case 'dumbbell':
    case 'gainweight':
      ioniconName = 'barbell-outline';
      break;
    case 'workoutlight':
      ioniconName = 'walk-outline';
      break;
    case 'workoutmoderate':
      ioniconName = 'bicycle-outline';
      break;
    case 'workoutheavy':
      ioniconName = 'flash-outline';
      break;
    case 'calendar':
    case 'birthdate':
      ioniconName = 'calendar-outline';
      break;
    case 'ruler':
    case 'height':
      ioniconName = 'resize-outline';
      break;
    case 'weight':
      ioniconName = 'speedometer-outline';
      break;
    case 'arrowleft':
      ioniconName = 'arrow-back-outline';
      break;
    case 'arrowright':
      ioniconName = 'arrow-forward-outline';
      break;
    case 'checkmark':
      ioniconName = 'checkmark-circle-outline';
      break;
    default:
      ioniconName = 'sparkles-outline';
  }

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name={ioniconName} size={size} color={color} />
    </View>
  );
}
