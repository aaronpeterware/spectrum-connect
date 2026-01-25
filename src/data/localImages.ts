// Local companion images
// These are bundled with the app for custom companion photos

import { ImageSourcePropType } from 'react-native';

// Default placeholder for companions without local images
const DEFAULT_PLACEHOLDER = require('../../assets/companions/mia.jpeg');

// Map companion IDs to their local images
export const LOCAL_COMPANION_IMAGES: Record<string, ImageSourcePropType> = {
  // Existing mapped images
  emma: require('../../assets/companions/emma.jpeg'),
  emma_au: require('../../assets/companions/emma.jpeg'),
  olivia: require('../../assets/companions/olivia.jpeg'),
  olivia_au: require('../../assets/companions/olivia.jpeg'),
  grace: require('../../assets/companions/grace.jpeg'),
  lily: require('../../assets/companions/lily.jpeg'),
  sophia: require('../../assets/companions/sophia.jpeg'),
  mia: require('../../assets/companions/mia.jpeg'),
  noah: require('../../assets/companions/noah.jpeg'),
  noah_au: require('../../assets/companions/noah.jpeg'),
  james: require('../../assets/companions/james.jpeg'),
  james_us: require('../../assets/companions/james.jpeg'),
  liam: require('../../assets/companions/liam.jpeg'),
  liam_au: require('../../assets/companions/liam.jpeg'),
  ethan: require('../../assets/companions/ethan.jpeg'),
  ethan_au: require('../../assets/companions/ethan.jpeg'),
  // Use similar placeholders for companions without dedicated images
  sophie: require('../../assets/companions/sophia.jpeg'),
  chloe: require('../../assets/companions/lily.jpeg'),
  jack: require('../../assets/companions/james.jpeg'),
  oliver: require('../../assets/companions/liam.jpeg'),
  ava: require('../../assets/companions/grace.jpeg'),
  isabella: require('../../assets/companions/olivia.jpeg'),
  madison: require('../../assets/companions/emma.jpeg'),
  harper: require('../../assets/companions/sophia.jpeg'),
  ella: require('../../assets/companions/lily.jpeg'),
  mason: require('../../assets/companions/noah.jpeg'),
  lucas: require('../../assets/companions/ethan.jpeg'),
  alexander: require('../../assets/companions/james.jpeg'),
  benjamin: require('../../assets/companions/liam.jpeg'),
};

// Check if a companion has a local image
export const hasLocalImage = (companionId: string): boolean => {
  return companionId in LOCAL_COMPANION_IMAGES;
};

// Get local image source for a companion (always returns an image)
export const getLocalImage = (companionId: string): ImageSourcePropType => {
  return LOCAL_COMPANION_IMAGES[companionId] || DEFAULT_PLACEHOLDER;
};
