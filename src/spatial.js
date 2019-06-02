import { parseKernel, updateKernel, parseToCustom } from './kernel';
import { posToIndex, getPartitions } from './utils';

import images from './../assets/images/*.jpeg';

if (!window.Worker) {
    console.log("You don't have workers, sorry!");
}

// DOM references
const canvasIn = document.getElementById('img-in');
const canvasOut = document.getElementById('img-out');
const imgSelect = document.getElementById('image-select');
const kernelSelect = document.getElementById('kernel-select');
const kernelTable = document.getElementById('kernel-table');
const applyBtn = document.getElementById('apply-kernel-btn');

// init global state
let numRunning = 0;
let imgOutData;
imgSelect.disabled = true;
applyBtn.disabled = false;

// globals
const ctxIn = canvasIn.getContext('2d');
const ctxOut = canvasOut.getContext('2d');
const imgIn = new Image();

// event listeners
imgIn.addEventListener('load', function() {
    ctxOut.clearRect(0, 0, canvasOut.width, canvasOut.height);
    canvasIn.width = imgIn.width;
    canvasIn.height = imgIn.height;
    ctxIn.drawImage(imgIn, 0, 0);
    canvasOut.width = imgIn.width;
    canvasOut.height = imgIn.height;
    imgSelect.disabled = false;
    imgOutData = ctxOut.createImageData(imgIn.width, imgIn.height);
});

imgIn.addEventListener('load', function() {
    for (const worker of workers) {
        worker.addEventListener('message', handleResponse);
    }
    applyBtn.addEventListener('click', sendRequest);
}, { once: true });

imgSelect.addEventListener('change', (event) => {
    imgIn.src = images[imgSelect.value];
    imgSelect.disabled = true;
});

kernelSelect.addEventListener('change', (event) => {
    updateKernel(kernelSelect.value);
});

kernelTable.addEventListener('input', (event) => {
    kernelSelect.value = 'Custom';
    parseToCustom();
});

// start program
imgIn.src = images[imgSelect.value];
updateKernel(kernelSelect.value);

const workers = [
    new Worker('task.js'),
    new Worker('task.js'),
    new Worker('task.js'),
    new Worker('task.js'),
];

// handlers
function handleResponse(event) {
    const toIndex = posToIndex(imgIn.width);
    const { newImage, xOff, yOff } = event.data;
    for (const [x, y, channels] of newImage) {
        const i = toIndex(xOff + x, yOff + y);
        imgOutData.data[i + 0] = channels[0];
        imgOutData.data[i + 1] = channels[1];
        imgOutData.data[i + 2] = channels[2];
        imgOutData.data[i + 3] = channels[3];
    }
    numRunning -= 1;
    if (numRunning === 0) {
        ctxOut.putImageData(imgOutData, 0, 0);
        console.timeEnd('Filter time');
        applyBtn.disabled = false;
    }
};

function sendRequest() {
    applyBtn.disabled = true;
    const partitions = getPartitions(imgIn);
    const kernel = parseKernel();

    for (let i = 0; i < workers.length; i++) {
        const [xOff, yOff, w, h] = partitions[i];
        const worker = workers[i];

        const subImgData = ctxIn.getImageData(xOff, yOff, w, h);
        worker.postMessage({
            op: 'spatial-filter',
            kernel,
            xOff,
            yOff,
            image: {
                width: subImgData.width,
                height: subImgData.height,
                pixels: subImgData.data,
            }
        });
        numRunning += 1;
    }
    console.time('Filter time');
}
