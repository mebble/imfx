/**
 * All sample kernel states must be stored in the DOM
 * so that the user can edit this state directly.
 * So write to DOM and read from DOM to get the kernel.
 * Custom kernel state is stored in this module.
 */

const parseValue = val => {
    const num = parseInt(val);
    return isNaN(num)
        ? 0
        : num;
};

const templates = {
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
    }
};

let customKernel = {
    squareMatrix: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
    ],
    scale: 1
};

export const updateKernel = (kernelName) => {
    const { squareMatrix, scale } = (kernelName === 'Custom')
        ? customKernel
        : templates[kernelName];
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

export const parseKernel = () => {
    const table = document.getElementById('kernel-table');
    const scaleInput = document.getElementById('scale-input');

    const squareMatrix = [];
    for (const { cells: [c1, c2, c3] } of table.rows) {
        const [inputL] = c1.children;
        const [inputM] = c2.children;
        const [inputR] = c3.children;

        const values = [ inputL.value, inputM.value, inputR.value ]
            .map(parseValue)
        squareMatrix.push(values);
    }

    const scale = parseValue(scaleInput.value);

    return {
        squareMatrix,
        scale
    };
};

export const parseToCustom = () => {
    const kernel = parseKernel();
    customKernel = kernel;
};
