// Adapted from mccraveiro's branch of filipedeschamps's Doom fire algorithm implementation
// http://fabiensanglard.net/doom_fire_psx/
// https://github.com/mccraveiro/doom-fire-algorithm/tree/canvas
// https://github.com/filipedeschamps/doom-fire-algorithm

const PALETTE = [
  { r: 7, g: 7, b: 7, a: 0 },
  { r: 24, g: 11, b: 7, a: 38 },
  { r: 35, g: 13, b: 7, a: 64 },
  { r: 52, g: 17, b: 7, a: 102 },
  { r: 69, g: 20, b: 7, a: 140 },
  { r: 85, g: 24, b: 7, a: 179 },
  { r: 97, g: 26, b: 7, a: 204 },
  { r: 113, g: 30, b: 7, a: 242 },
  { r: 126, g: 34, b: 7, a: 255 },
  { r: 133, g: 37, b: 7, a: 255 },
  { r: 143, g: 42, b: 7, a: 255 },
  { r: 154, g: 47, b: 7, a: 255 },
  { r: 161, g: 50, b: 7, a: 255 },
  { r: 171, g: 55, b: 7, a: 255 },
  { r: 181, g: 60, b: 7, a: 255 },
  { r: 192, g: 65, b: 7, a: 255 },
  { r: 199, g: 68, b: 7, a: 255 },
  { r: 209, g: 73, b: 7, a: 255 },
  { r: 220, g: 77, b: 7, a: 255 },
  { r: 224, g: 83, b: 9, a: 255 },
  { r: 226, g: 97, b: 14, a: 255 },
  { r: 228, g: 110, b: 18, a: 255 },
  { r: 229, g: 119, b: 22, a: 255 },
  { r: 231, g: 132, b: 27, a: 255 },
  { r: 233, g: 146, b: 31, a: 255 },
  { r: 235, g: 159, b: 36, a: 255 },
  { r: 237, g: 168, b: 40, a: 255 },
  { r: 239, g: 182, b: 44, a: 255 },
  { r: 241, g: 195, b: 49, a: 255 },
  { r: 242, g: 204, b: 53, a: 255 },
  { r: 244, g: 217, b: 57, a: 255 },
  { r: 246, g: 231, b: 62, a: 255 },
  { r: 248, g: 236, b: 77, a: 255 },
  { r: 249, g: 240, b: 115, a: 255 },
  { r: 251, g: 244, b: 153, a: 255 },
  { r: 252, g: 248, b: 191, a: 255 },
  { r: 253, g: 251, b: 217, a: 255 },
  { r: 255, g: 255, b: 255, a: 255 },
];

class Fire {
  context: CanvasRenderingContext2D;
  image: ImageData;
  interval: number;
  width: number;
  height: number;
  lastFrameTimestamp: number;
  pixelsArray: number[];
  animationFrameRequestHandle?: number;

  constructor(
    canvas: HTMLCanvasElement,
    fps: number,
    width: number,
    height: number
  ) {
    canvas.width = this.width = width;
    canvas.height = this.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('invalid canvas context ID');
    }

    this.context = context;

    this.image = context.createImageData(this.width, this.height);

    this.pixelsArray = [];

    this.interval = 1000 / fps;

    this.calculateFirePropagation = this.calculateFirePropagation.bind(this);

    this.createFireDataStructure();
    this.createFireSource();

    this.lastFrameTimestamp = window.performance.now();

    this.calculateFirePropagation();
  }

  destroy() {
    if (this.animationFrameRequestHandle) {
      cancelAnimationFrame(this.animationFrameRequestHandle);
    }
  }

  createFireDataStructure() {
    const numberOfPixels = this.width * this.height;

    for (let i = 0; i < numberOfPixels; i++) {
      this.pixelsArray[i] = 0;
    }
  }

  calculateFirePropagation(newFrameTimestamp?: number) {
    this.animationFrameRequestHandle = requestAnimationFrame(
      this.calculateFirePropagation
    );

    if (!newFrameTimestamp) {
      return;
    }

    const elapsed = newFrameTimestamp - this.lastFrameTimestamp;

    if (elapsed > this.interval) {
      this.lastFrameTimestamp = newFrameTimestamp - (elapsed % this.interval);

      for (let column = 0; column < this.width; column++) {
        for (let row = 0; row < this.height; row++) {
          const pixelIndex = column + this.width * row;

          this.updateFireIntensityPerPixel(pixelIndex);
        }
      }

      this.renderFire();
    }
  }

  updateFireIntensityPerPixel(currentPixelIndex: number) {
    const belowPixelIndex = currentPixelIndex + this.width;

    // below pixel index overflows canvas
    if (belowPixelIndex >= this.width * this.height) {
      return;
    }

    const decay = Math.floor(Math.random() * 3);
    const belowPixelFireIntensity = this.pixelsArray[belowPixelIndex];
    const newFireIntensity =
      belowPixelFireIntensity - decay >= 0
        ? belowPixelFireIntensity - decay
        : 0;

    this.pixelsArray[currentPixelIndex - decay] = newFireIntensity;
  }

  renderFire() {
    for (
      let pixelIndex = 0;
      pixelIndex < this.pixelsArray.length;
      pixelIndex++
    ) {
      const fireIntensity = this.pixelsArray[pixelIndex];
      const color = PALETTE[fireIntensity];

      this.image.data[pixelIndex * 4] = color.r;
      this.image.data[pixelIndex * 4 + 1] = color.g;
      this.image.data[pixelIndex * 4 + 2] = color.b;
      this.image.data[pixelIndex * 4 + 3] = color.a;
    }

    if (this.context) {
      this.context.putImageData(this.image, 0, 0);
    }
  }

  createFireSource() {
    for (let column = 0; column <= this.width; column++) {
      const overflowPixelIndex = this.width * this.height;
      const pixelIndex = overflowPixelIndex - this.width + column;

      this.pixelsArray[pixelIndex] = 36;
    }
  }
}

export default Fire;
