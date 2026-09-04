import { Presentation, VideoExportOptions, ExportProgress } from '../types/presentation';
import { renderCompleteSlide, renderTransitionFrame, preloadPresentationImages } from './canvasRenderer';
import { getOrGenerateSlideAudio } from './ttsService';

export class VideoExporter {
  private isCancelled = false;
  private isPaused = false;

  public cancel(): void {
    this.isCancelled = true;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public async exportVideo(
    presentation: Presentation,
    options: VideoExportOptions,
    onProgress: (progress: ExportProgress) => void
  ): Promise<Blob> {
    this.isCancelled = false;
    this.isPaused = false;

    // Determine Canvas Dimensions
    let width = 1920;
    let height = 1080;
    if (options.resolution === '720p') { width = 1280; height = 720; }
    else if (options.resolution === '1440p') { width = 2560; height = 1440; }
    else if (options.resolution === '4K') { width = 3840; height = 2160; }

    const fps = options.frameRate || 30;
    const slides = presentation.slides;

    onProgress({
      status: 'preparing',
      currentSlide: 0,
      totalSlides: slides.length,
      currentFrame: 0,
      totalFrames: 100,
      percent: 5,
      estimatedSecondsLeft: 30,
    });

    // 1. Preload all presentation images
    await preloadPresentationImages(slides);

    // 2. Prepare audio and compute durations for all slides
    interface SlideAudioInfo {
      audioBlobUrl: string;
      duration: number;
      audioBuffer: AudioBuffer | null;
      slideDuration: number;
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const slideAudioList: SlideAudioInfo[] = [];

    for (let i = 0; i < slides.length; i++) {
      if (this.isCancelled) throw new Error('Export cancelled by user');
      const slide = slides[i];
      const voiceSettings = slide.voiceSettings || presentation.globalVoiceSettings;

      let audioInfo = {
        audioBlobUrl: '',
        duration: 3,
        audioBuffer: null as AudioBuffer | null,
        slideDuration: Math.max(3, slide.duration || 5),
      };

      if (slide.script && slide.script.trim()) {
        try {
          const generated = await getOrGenerateSlideAudio(slide.script, voiceSettings, presentation.pronunciationDictionary);
          audioInfo.audioBlobUrl = generated.blobUrl;
          audioInfo.duration = generated.duration;

          // Decode into AudioBuffer
          const res = await fetch(generated.blobUrl);
          const arrayBuffer = await res.arrayBuffer();
          audioInfo.audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const padding = slide.paddingDuration ?? 1.0;
          audioInfo.slideDuration = Math.max(slide.duration || 3, generated.duration + padding);
        } catch (e) {
          console.warn('Audio generation fallback for slide:', i, e);
        }
      }

      slideAudioList.push(audioInfo);
      onProgress({
        status: 'preparing',
        currentSlide: i + 1,
        totalSlides: slides.length,
        currentFrame: 0,
        totalFrames: 100,
        percent: Math.round(5 + ((i + 1) / slides.length) * 15),
        estimatedSecondsLeft: 25,
      });
    }

    // 3. Compute total presentation duration and frames
    let totalDurationSec = 0;
    for (const info of slideAudioList) {
      totalDurationSec += info.slideDuration;
    }
    const totalFrames = Math.ceil(totalDurationSec * fps);

    // 4. Setup Canvas and MediaStream
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Slide buffers for smooth transition crossfades
    const fromCanvas = document.createElement('canvas');
    fromCanvas.width = width;
    fromCanvas.height = height;
    const fromCtx = fromCanvas.getContext('2d', { alpha: false })!;

    const toCanvas = document.createElement('canvas');
    toCanvas.width = width;
    toCanvas.height = height;
    const toCtx = toCanvas.getContext('2d', { alpha: false })!;

    // MediaRecorder setup
    const videoStream = canvas.captureStream(fps);
    const audioDestination = audioCtx.createMediaStreamDestination();

    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ]);

    // Format detection
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (options.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a')) {
      mimeType = 'video/mp4;codecs=avc1,mp4a';
    } else if (options.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mimeType = 'video/webm;codecs=vp8,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: options.bitrate || 5000000,
    });

    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(100); // chunk every 100ms

    const startTime = Date.now();
    let currentFrameCount = 0;

    // 5. Render slides in sequence
    for (let slideIdx = 0; slideIdx < slides.length; slideIdx++) {
      if (this.isCancelled) {
        mediaRecorder.stop();
        audioCtx.close();
        throw new Error('Export cancelled by user');
      }

      const slide = slides[slideIdx];
      const audioInfo = slideAudioList[slideIdx];
      const slideDuration = audioInfo.slideDuration;
      const slideFrames = Math.ceil(slideDuration * fps);

      // Play audio buffer for this slide into the recorder destination
      if (audioInfo.audioBuffer) {
        const sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioInfo.audioBuffer;
        sourceNode.connect(audioDestination);
        sourceNode.start();
      }

      // Check transition from previous slide
      const hasTransition = slideIdx > 0 && slide.transition && slide.transition.type !== 'none';
      const transitionDuration = hasTransition ? Math.min(1.2, slide.transition.duration || 0.6) : 0;
      const transitionFrames = Math.ceil(transitionDuration * fps);

      if (hasTransition) {
        renderCompleteSlide(fromCtx, slides[slideIdx - 1], slideIdx - 1, slides.length, presentation.masterSlide, width, height);
        renderCompleteSlide(toCtx, slide, slideIdx, slides.length, presentation.masterSlide, width, height);
      }

      // Frame interval timing
      const frameDurationMs = 1000 / fps;

      for (let f = 0; f < slideFrames; f++) {
        if (this.isCancelled) {
          mediaRecorder.stop();
          audioCtx.close();
          throw new Error('Export cancelled by user');
        }

        // Handle pause
        while (this.isPaused && !this.isCancelled) {
          await new Promise((r) => setTimeout(r, 200));
        }

        // Transition frames vs static slide frames
        if (hasTransition && f < transitionFrames) {
          const progress = f / transitionFrames;
          renderTransitionFrame(
            ctx,
            slides[slideIdx - 1],
            slide,
            slide.transition.type,
            progress,
            fromCanvas,
            toCanvas,
            width,
            height
          );
        } else {
          renderCompleteSlide(ctx, slide, slideIdx, slides.length, presentation.masterSlide, width, height);
        }

        currentFrameCount++;
        const elapsed = (Date.now() - startTime) / 1000;
        const framesPerSec = currentFrameCount / Math.max(0.1, elapsed);
        const remainingFrames = totalFrames - currentFrameCount;
        const etaSeconds = Math.max(1, Math.round(remainingFrames / Math.max(1, framesPerSec)));

        const percent = Math.min(99, Math.round(20 + (currentFrameCount / totalFrames) * 78));

        if (currentFrameCount % 5 === 0 || currentFrameCount === totalFrames) {
          onProgress({
            status: 'rendering',
            currentSlide: slideIdx + 1,
            totalSlides: slides.length,
            currentFrame: currentFrameCount,
            totalFrames,
            percent,
            estimatedSecondsLeft: etaSeconds,
          });
        }

        // Yield for real-time capture
        await new Promise((resolve) => setTimeout(resolve, frameDurationMs * 0.4));
      }
    }

    onProgress({
      status: 'encoding',
      currentSlide: slides.length,
      totalSlides: slides.length,
      currentFrame: totalFrames,
      totalFrames,
      percent: 99,
      estimatedSecondsLeft: 2,
    });

    // Finalize recording
    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        try {
          audioCtx.close();
          const finalBlob = new Blob(recordedChunks, { type: mimeType });
          onProgress({
            status: 'completed',
            currentSlide: slides.length,
            totalSlides: slides.length,
            currentFrame: totalFrames,
            totalFrames,
            percent: 100,
            estimatedSecondsLeft: 0,
          });
          resolve(finalBlob);
        } catch (err) {
          reject(err);
        }
      };

      // Add a small buffer before stopping
      setTimeout(() => {
        mediaRecorder.stop();
      }, 500);
    });
  }
}
