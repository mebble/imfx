const _ = require('lodash');

/**
 * All kernel state must be stored in the DOM
 * so that the user can edit this state directly.
 * So write to DOM and read from DOM to get the kernel
 */

module.exports.templates = {
    // Source: https://en.wikipedia.org/wiki/Kernel_(image_processing)
    'Sharpen': {
        squareMatrix: [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ],
        scalar: 1
    },
    'Box Blur': {
        squareMatrix: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ],
        scalar: 9
    },
    'Edge Detection': {
        squareMatrix: [
            [-1, -1, -1],
            [-1, 8, -1],
            [-1, -1, -1]
        ],
        scalar: 1
    },
    'Gaussian Blur': {
        squareMatrix: [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
        ],
        scalar: 16
    },
    // Source: http://setosa.io/ev/image-kernels/
    'Emboss': {
        squareMatrix: [
            [-2, -1, 0],
            [-1, 1, 1],
            [0, 1, 2]
        ],
        scalar: 1
    },
}
module.exports.Kernel = ({ squareMatrix, scalar }) => {
    const array = _.flatten(squareMatrix);
    return {
        array,
        scale: scalar
    };
};

module.exports.updateKernel = ({ squareMatrix }) => {
    const table = document.getElementById('kernel-table');

    for (let i = 0; i < table.rows.length; i++) {
        const { cells: [c1, c2, c3] } = table.rows[i];
        const [ x, y, z ] = squareMatrix[i];
        
        const [inputL] = c1.children;
        const [inputM] = c2.children;
        const [inputR] = c3.children;
        
        inputL.value = x;
        inputM.value = y;
        inputR.value = z;
    }
};
