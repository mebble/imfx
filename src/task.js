import _ from 'lodash';
import { posToIndex, bitSlicePixel } from './utils';

self.addEventListener('message', (event) => {
    if (event.data.op === 'spatial-filter') {
        const { kernel, image, xOff, yOff } = event.data;
        const newImage = filterImage(kernel, image);
        self.postMessage({ newImage, xOff, yOff });
        return;
    }

    if (event.data.op === 'bit-plane-slicing') {
        const { image, bitIndex } = event.data;
        bitPlaneSlicing(image, bitIndex);
        self.postMessage({ newImage: image });
        return;
    }
});

function bitPlaneSlicing(image, bitIndex) {
    const toIndex = posToIndex(image.width);
    const slicePixel = bitSlicePixel(bitIndex);
    // for bit-plane-slicing, we can mutate the image in-place
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const i = toIndex(x, y);
            const r = slicePixel(image.pixels[i + 0]);
            const g = slicePixel(image.pixels[i + 1]);
            const b = slicePixel(image.pixels[i + 2]);
            const a = slicePixel(image.pixels[i + 3]);
            image.pixels[i + 0] = r;
            image.pixels[i + 1] = g;
            image.pixels[i + 2] = b;
            image.pixels[i + 3] = a;
        }
    }
}

function filterImage(kernel, image) {
    const applyKernel = useKernel({
        kernelArray: _.flatten(kernel.squareMatrix),
        scale: kernel.scale
    }, image);

    const resImage = [];
    // don't process pixels on the image's edge. These edge pixels also won't be returned to the main thread
    for (let y = 1; y < image.height - 1; y++) {
        for (let x = 1; x < image.width - 1; x++) {
            const newPixelChannels = [
                applyKernel(x, y, 0),
                applyKernel(x, y, 1),
                applyKernel(x, y, 2),
                255
            ];
            resImage.push([x, y, newPixelChannels]);
        }
    }

    return resImage;
}

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
