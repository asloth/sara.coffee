// The five stations of the ride, in order. Everything that depends on "where the visitor is"
// (scene painting, window view, light, the passenger's seat and pose) is keyed off this list.

export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'sunset' | 'night';

/** Where the passenger sits in a scene, as fractions of the 16:9 scene panel. */
export interface Seat {
  /** horizontal centre of her body */
  x: number;
  /** the seat cushion's top edge, where her hips go */
  y: number;
  /** her full pose height (the 896 x 1200 Rive artboard) */
  h: number;
}

export interface Station {
  id: 'departure' | 'about' | 'work' | 'experience' | 'contact';
  name: string;
  /** the kanji line under the station name on the sign */
  jp: string;
  time: TimeOfDay;
  /** painting in public/art/, without the size suffix */
  scene: string;
  /** a second panel that continues the scene to the right (the Work car is two panels long) */
  sceneContinued?: string;
  /** scroll length of the station's section, in viewport heights */
  length: number;
  seat: Seat;
}

// Measured on the master paintings (2752 x 1536): the car bench top sits at y 1165, the platform
// bench at y 1013; the platform bench is further away, so she is drawn about 0.69 times smaller there.
// in the cars she sits into the cushion a little (y .74) and is sized so her shoes rest on the floor.
// The car's stainless poles stand at x .281, .503 and .729 (measured on the master painting): she
// sits centred between the first two, never in front of one.
const CAR_SEAT: Seat = { x: 0.392, y: 0.74, h: 0.5 };
const PLATFORM_SEAT: Seat = { x: 0.43, y: 0.66, h: 0.39 };

export const STATIONS: Station[] = [
  { id: 'departure', name: 'Departure', jp: '出発', time: 'morning', scene: 'platform-morning', length: 1.6, seat: PLATFORM_SEAT },
  { id: 'about', name: 'About', jp: '紹介', time: 'noon', scene: 'car-noon', length: 1.8, seat: CAR_SEAT },
  // two panels long and walked along, so she sits towards the right of the first one (between the
  // .729 pole and the bench end): in view when the camera is half way down the car, at the station
  { id: 'work', name: 'Work', jp: '作品', time: 'afternoon', scene: 'car-afternoon', sceneContinued: 'car-afternoon', length: 3, seat: { ...CAR_SEAT, x: 0.815 } },
  { id: 'experience', name: 'Experience', jp: '経歴', time: 'sunset', scene: 'car-sunset', length: 2, seat: CAR_SEAT },
  { id: 'contact', name: 'Last stop', jp: '終点', time: 'night', scene: 'platform-night', length: 1.6, seat: PLATFORM_SEAT },
];

/** The light at each time of day: how the passenger is graded to sit in the painted light, and a
 *  faint wash over the whole stage that carries the blend between two stations. */
export interface Light {
  brightness: number;
  saturate: number;
  /** per-channel multipliers: the colour of the light falling on her */
  gain: [number, number, number];
  /** soft-light wash colour and strength */
  wash: [number, number, number];
  washAlpha: number;
}

export const LIGHT: Record<TimeOfDay, Light> = {
  morning: { brightness: 1.02, saturate: 0.94, gain: [0.97, 1, 1.05], wash: [150, 190, 255], washAlpha: 0.12 },
  noon: { brightness: 1, saturate: 1, gain: [1, 1, 1], wash: [255, 255, 255], washAlpha: 0 },
  afternoon: { brightness: 1, saturate: 1.05, gain: [1.06, 1, 0.9], wash: [255, 190, 110], washAlpha: 0.12 },
  sunset: { brightness: 0.92, saturate: 1.1, gain: [1.12, 0.9, 0.76], wash: [255, 110, 50], washAlpha: 0.16 },
  night: { brightness: 0.7, saturate: 0.8, gain: [0.8, 0.88, 1.12], wash: [30, 40, 110], washAlpha: 0.22 },
};

export const POSE_ASPECT = 896 / 1200;
/** her hips, as a fraction of the pose height from the top */
export const POSE_HIP = 640 / 1200;
