export const posToIndex = imgWidth => (x, y) => {
    /**
     * maps from a pixel channel's location (x, y) to its index in the array of an image
     */
    const i = 4 * x + 4 * y * imgWidth;
    return i;
};

export const bitSlicePixel = bitIndex => num => {
    const bits = num.toString(2);
    const res = bits[bitIndex] * 255;
    return res;
};

export const firstNonZero = nums => {
    for (const x of nums) {
        if (x !== 0) {
            return x;
        }
    }
};

export const getPartitions = image => {
    /**
     * Return 4 partitions of an image,
     * each partition being a tuple (xOff, yOff, partWidth, partHeight)
     */
    // split point pixels
    const xL = Math.floor((image.width - 1) / 2);
    const xR = xL + 1;
    const yL = Math.floor((image.height - 1) / 2);
    const yR = yL + 1;

    const partitions = [
        [0, 0, xR - 0 + 1, yR - 0 + 1],  // upperL
        [xL, 0, image.width - xL, yR - 0 + 1],  // upperR
        [0, yL, xR - 0 + 1, image.height - yL],  // lowerL
        [xL, yL, image.width - xL, image.height - yL]  // lowerR
    ];

    return partitions;
};
