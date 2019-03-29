import _ from 'lodash';
import { posToIndex } from './utils';

self.addEventListener('message', (event) => {
    const { kernel, image, xOff, yOff } = event.data;

    const applyKernel = useKernel({
        kernelArray: _.flatten(kernel.squareMatrix),
        scale: kernel.scale
    }, image);

    const newImage = [];
    // don't process pixels on the image's edge. These edge pixels also won't be returned to the main thread
    for (let y = 1; y < image.height-1; y++) {
        for (let x = 1; x < image.width-1; x++) {
            const newPixelChannels = [
                applyKernel(x, y, 0),
                applyKernel(x, y, 1),
                applyKernel(x, y, 2),
                255
            ];
            newImage.push([x, y, newPixelChannels]);
        }
    }
    self.postMessage({ newImage, xOff, yOff });
});

function pixelsAround(img, x, y, i) {
    const pos = [
        [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
        [x - 1, y], [x, y], [x + 1, y],
        [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]
    ];
    const toIndex = posToIndex(img.width);
    return _.map(pos, ([a, b]) => {
        if (a < 0 || b < 0 || a >= img.width || b >= img.height) {
            return 0;
        }
        return img.pixels[toIndex(a, b) + i];
    });
}

function useKernel({ kernelArray, scale }, image) {
    return (x, y, i) => {
        const pixels = pixelsAround(image, x, y, i);
        const zip = _.zipWith(
            kernelArray,
            pixels,
            (k, p) => k * p
        );
        const sum = _.sum(zip);
        return (scale === 0)
            ? sum
            : sum / scale;
    };
}
