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
