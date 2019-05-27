import _ from 'lodash';
import { posToIndex, bitSlicePixel, firstNonZero } from './utils';

self.addEventListener('message', (event) => {
    const { op } = event.data;

    if (op === 'spatial-filter') {
        const { kernel, image, xOff, yOff } = event.data;
        const newImage = filterImage(kernel, image);
        self.postMessage({ newImage, xOff, yOff });
        return;
    }

    if (op === 'bit-plane-slicing') {
        const { image, bitIndex } = event.data;
        bitPlaneSlicing(image, bitIndex);
        self.postMessage({ newImage: image });
        return;
    }

    if (op === 'hist-equal') {
        const { image } = event.data;
        histEqualisation(image);
        self.postMessage({ newImage: image });
        return;
    }
});

function histEqualisation(image) {
    const toIndex = posToIndex(image.width);

    // don't equalise the alpha channel, or else output might be transparent
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);

    // build the histograms of all channels
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const i = toIndex(x, y);
            const r = image.pixels[i + 0];
            const g = image.pixels[i + 1];
            const b = image.pixels[i + 2];
            histR[r]++;
            histG[g]++;
            histB[b]++;
        }
    }

    // build the CDFs
    const cdfR = getCDF(histR);
    const cdfG = getCDF(histG);
    const cdfB = getCDF(histB);

    // Get the cdfMin (CDF firstNonZero)
    // Note: the CDF's firstNonZero is equal to histogram's firstNonZero
    const minR = firstNonZero(cdfR);
    const minG = firstNonZero(cdfG);
    const minB = firstNonZero(cdfB);

    // build the equalisation functions
    const numPixels = image.width * image.height;
    const equalR = useEqual(cdfR, minR, numPixels);
    const equalG = useEqual(cdfG, minG, numPixels);
    const equalB = useEqual(cdfB, minB, numPixels);

    // perform equalisation by mutating the image in-place
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const i = toIndex(x, y);
            const r = equalR(image.pixels[i + 0]);
            const g = equalG(image.pixels[i + 1]);
            const b = equalB(image.pixels[i + 2]);
            image.pixels[i + 0] = r;
            image.pixels[i + 1] = g;
            image.pixels[i + 2] = b;
        }
    }
}

function useEqual(cdf, cdfMin, numPixels) {
    const part = 255 / (numPixels - cdfMin);
    return (level) => {
        return Math.round((cdf[level] - cdfMin) * part);
    };
}

function getCDF(histogram) {
    let acc = 0;
    const cdf = histogram.map((count, i) => {
        acc += count;
        return acc;
    });
    return cdf;
}

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
