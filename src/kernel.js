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
        scale: 1
    },
    'Box Blur': {
        squareMatrix: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ],
        scale: 9
    },
    'Edge Detection': {
        squareMatrix: [
            [-1, -1, -1],
            [-1, 8, -1],
            [-1, -1, -1]
        ],
        scale: 1
    },
    'Gaussian Blur': {
        squareMatrix: [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
        ],
        scale: 16
    },
    // Source: http://setosa.io/ev/image-kernels/
    'Emboss': {
        squareMatrix: [
            [-2, -1, 0],
            [-1, 1, 1],
            [0, 1, 2]
        ],
        scale: 1
    },
}
module.exports.updateKernel = ({ squareMatrix, scale }) => {
    const table = document.getElementById('kernel-table');
    const scaleInput = document.getElementById('scale-input');

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

    scaleInput.value = scale;
};
module.exports.parseKernel = () => {
    const table = document.getElementById('kernel-table');
    const scaleInput = document.getElementById('scale-input');

    const squareMatrix = [];
    for (let i = 0; i < table.rows.length; i++) {
        const { cells: [c1, c2, c3] } = table.rows[i];

        const [inputL] = c1.children;
        const [inputM] = c2.children;
        const [inputR] = c3.children;

        const values = [ inputL.value, inputM.value, inputR.value ]
            .map(val => {
                const num = parseInt(val);
                return isNaN(num)
                    ? 0
                    : num;
            })
        squareMatrix.push(values);
    }

    return {
        squareMatrix,
        scale: scaleInput.value
    };
};
