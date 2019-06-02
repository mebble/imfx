import images from './../assets/images/*.jpeg';

if (!window.Worker) {
    console.log("You don't have workers, sorry!");
}

// DOM references
const canvasIn = document.getElementById('img-in');
const canvasOut = document.getElementById('img-out');
const imgSelect = document.getElementById('image-select');
const applyBtn = document.getElementById('apply-equal-btn');

// init global state
let imgOutData;
imgSelect.disabled = true;
applyBtn.disabled = false;

// globals
const ctxIn = canvasIn.getContext('2d');
const ctxOut = canvasOut.getContext('2d');
const imgIn = new Image();

// event listeners
imgIn.addEventListener('load', function () {
    ctxOut.clearRect(0, 0, canvasOut.width, canvasOut.height);
    canvasIn.width = imgIn.width;
    canvasIn.height = imgIn.height;
    ctxIn.drawImage(imgIn, 0, 0);
    canvasOut.width = imgIn.width;
    canvasOut.height = imgIn.height;
    imgSelect.disabled = false;
    imgOutData = ctxOut.createImageData(imgIn.width, imgIn.height);
});

imgIn.addEventListener('load', function () {
    worker.addEventListener('message', handleResponse);
    applyBtn.addEventListener('click', sendRequest);
}, { once: true });

imgSelect.addEventListener('change', (event) => {
    imgIn.src = images[imgSelect.value];
    imgSelect.disabled = true;
});

// start program
imgIn.src = images[imgSelect.value];
const worker = new Worker('task.js');

// handlers
function handleResponse(event) {
    const { newImage } = event.data;
    for (let i = 0; i < newImage.pixels.length; i++) {
        imgOutData.data[i] = newImage.pixels[i];
    }
    ctxOut.putImageData(imgOutData, 0, 0);
    console.timeEnd('Equalisation time');
    applyBtn.disabled = false;
}

function sendRequest() {
    applyBtn.disabled = true;
    const imgInData = ctxIn.getImageData(0, 0, canvasIn.width, canvasIn.height);
    worker.postMessage({
        op: 'hist-equal',
        image: {
            width: imgInData.width,
            height: imgInData.height,
            pixels: imgInData.data,
        }
    });
    console.time('Equalisation time');
}
