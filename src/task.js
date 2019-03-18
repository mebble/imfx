const _ = require('lodash');
const { Kernel } = require('./kernel.js');

self.addEventListener('message', (event) => {
    const { kernel: kernelData, image } = event.data;
    
    const kernel = Kernel(kernelData);
    const newImage = [];

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
            const newPixelChannels = [];
            for (let i = 0; i < 3; i++) {
                const pixels = pixelsAround(image, x, y, i);
                const zip = _.zipWith(kernel.array, pixels, (k, p) => k * p);
                const sum = _.sum(zip);
                const newPixel = sum / kernel.scale;
                newPixelChannels.push(newPixel);
            }
            newImage.push([x, y, [...newPixelChannels, 255]]);
        }
    }
    self.postMessage({ newImage });
});

function pixelsAround(img, x, y, i) {
    const pos = [
        [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
        [x - 1, y], [x, y], [x + 1, y],
        [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]
    ];
    return _.map(pos, ([a, b]) => {
        if (a < 0 || b < 0 || a >= img.width || b >= img.height) {
            return 0;
        }
        return img.pixels[loc(a, b, img.width) + i];
    });
}

function loc(x, y, rowLen) {
    return 4 * x + 4 * y * rowLen;
}
