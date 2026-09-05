export type ElementType = 'text' | 'shape' | 'image' | 'table' | 'icon';

export type ShapeType = 'rectangle' | 'rounded-rect' | 'circle' | 'triangle' | 'arrow-right' | 'arrow-left' | 'line' | 'star' | 'diamond' | 'heart' | 'speech-bubble';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number; // standard 1920x1080 canvas coordinate space
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  opacity?: number; // 0 - 1
  zIndex?: number;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowColor?: string;
  animation?: ElementAnimation;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  isBulletList?: boolean;
  isNumberedList?: boolean;
  padding?: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
  objectFit: 'contain' | 'cover' | 'fill';
  blur?: number;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  data: string[][];
  headerBgColor: string;
  headerTextColor: string;
  cellBgColor: string;
  cellTextColor: string;
  borderColor: string;
  borderWidth: number;
  fontSize: number;
}

export interface IconElement extends BaseElement {
  type: 'icon';
  iconName: string;
  color: string;
  strokeWidth?: number;
}

export type SlideElement = TextElement | ShapeElement | ImageElement | TableElement | IconElement;

export interface ElementAnimation {
  type: 'none' | 'fade-in' | 'fly-left' | 'fly-right' | 'fly-top' | 'fly-bottom' | 'zoom-in' | 'bounce-in' | 'rotate-in';
  duration: number; // seconds
  delay: number; // seconds
  trigger?: 'on-click' | 'after-previous' | 'with-previous' | 'time-cue';
  cuePointSec?: number; // cue point relative to slide narration start
}

export type BackgroundType = 'solid' | 'linear-gradient' | 'radial-gradient' | 'image' | 'pattern';

export type PatternType = 'dots' | 'grid' | 'waves' | 'diagonal-stripes';

export interface SlideBackground {
  type: BackgroundType;
  color: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number; // degrees
  imageUrl?: string;
  imageBlur?: number;
  overlayOpacity?: number;
  pattern?: PatternType;
  patternColor?: string;
}

export type TransitionType = 
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'flip-x'
  | 'flip-y'
  | 'rotate-cw'
  | 'rotate-ccw'
  | 'wipe-left'
  | 'wipe-right'
  | 'push-left'
  | 'push-right'
  | 'cube-left'
  | 'cube-right'
  | 'split-horizontal'
  | 'split-vertical'
  | 'dissolve'
  | 'blur-fade';

export interface SlideTransition {
  type: TransitionType;
  duration: number; // seconds (0.2 - 2.0)
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface VoiceSettings {
  voice: string; // e.g. 'en-US-GuyNeural' or 'en-US-JennyNeural'
  rate: number; // 0.5 - 2.0 (default 1.0)
  pitch: number; // -50% to +50% (default 0)
  volume: number; // 0 - 100% (default 100)
}

export interface PronunciationRule {
  id?: string;
  word: string;
  replacement?: string;
  pronunciation?: string;
}

export type PronunciationEntry = PronunciationRule;

export interface KenBurnsSettings {
  enabled: boolean;
  effect: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'subtle-drift';
  intensity?: number; // 1.05 to 1.25 (default 1.10)
}

export interface Slide {
  id: string;
  title: string;
  layout: string;
  elements: SlideElement[];
  background: SlideBackground;
  transition: SlideTransition;
  script: string;
  voiceSettings?: VoiceSettings;
  duration: number; // in seconds (user defined or auto-calculated from audio)
  audioBlobUrl?: string;
  audioDuration?: number;
  audioWaveformData?: number[];
  autoAdvance?: boolean;
  paddingDuration?: number; // seconds after audio ends, default 1.0s
  kenBurns?: KenBurnsSettings;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  background: SlideBackground;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  textColor: string;
  mutedColor: string;
  cardBg: string;
  previewGradient: string;
}

export interface MasterSlide {
  showHeader: boolean;
  headerText: string;
  showFooter: boolean;
  footerText: string;
  showSlideNumber: boolean;
  slideNumberPosition: 'bottom-right' | 'bottom-left' | 'top-right';
  brandingText?: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface CaptionSettings {
  enabled: boolean;
  style: 'karaoke-highlight' | 'bounce-pop' | 'minimal-pill' | 'classic-sub';
  position: 'bottom' | 'center' | 'top';
  fontSize?: number;
  highlightColor?: string; // e.g. '#3b82f6'
  textColor?: string;
}

export interface BackgroundMusicSettings {
  trackId: string; // 'none' | 'ambient-flow' | 'corporate-pulse' | 'lo-fi-chill' | 'inspirational' | 'tech-minimal'
  volume: number; // 0 - 100
  ducking: boolean;
  duckingAmount: number; // 0 - 100
  loop: boolean;
}

export interface Presentation {
  id: string;
  title: string;
  themeId: string;
  slides: Slide[];
  masterSlide: MasterSlide;
  globalVoiceSettings: VoiceSettings;
  pronunciationDictionary: PronunciationRule[];
  canvasWidth: number; // standard 1920
  canvasHeight: number; // standard 1080
  aspectRatio?: AspectRatio;
  captionSettings?: CaptionSettings;
  backgroundMusic?: BackgroundMusicSettings;
}

export interface VideoExportOptions {
  resolution: '720p' | '1080p' | '1440p' | '4K';
  frameRate: 24 | 30 | 60;
  bitrate: number;
  format: 'webm' | 'mp4';
  includeAudio?: boolean;
  includeCaptions?: boolean;
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error' | 'paused';
  currentSlide: number;
  totalSlides: number;
  currentFrame: number;
  totalFrames: number;
  percent: number;
  estimatedSecondsLeft: number;
  error?: string;
}
