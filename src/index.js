import p5 from 'p5';
import { parseKernel, updateKernel } from './kernel.js';
import images from './../assets/images/*.jpeg';

if (!window.Worker) {
    console.log("You don't have workers, sorry!");
}

const worker = new Worker('task.js');
const applyBtn = document.getElementById('apply-kernel-btn');
const kernelSelect = document.getElementById('kernel-select');

let imgIn;
let imgOut;
let sketchIn;
let sketchOut;

sketchIn = new p5(function(sIn) {
    sIn.preload = function() {
        imgIn = sIn.loadImage(images['bones-building']);
    };
    sIn.setup = function() {
        sIn.createCanvas(imgIn.width, imgIn.height);
        sketchOut = new p5(function(sOut) {
            sOut.setup = function() {
                sOut.createCanvas(imgIn.width, imgIn.height);
                imgOut = sOut.createImage(imgIn.width, imgIn.height);

                /**
                 * init listeneres only once imgIn and imgOut have been defined
                */
                worker.addEventListener('message', (event) => {
                    const { newImage } = event.data;
                    for (const [x, y, channels] of newImage) {
                        imgOut.set(x, y, channels);
                    }
                    // end cycle: loadPixels -> post image -> get new image -> updatePixels
                    imgIn.updatePixels();
                    imgOut.updatePixels();

                    applyBtn.disabled = false;
                });

                applyBtn.addEventListener('click', (event) => {
                    applyBtn.disabled = true;

                    // begin cycle: loadPixels -> post image -> get new image -> updatePixels
                    imgIn.loadPixels();
                    imgOut.loadPixels();

                    worker.postMessage({
                        kernel: parseKernel(),
                        image: {
                            width: imgIn.width,
                            height: imgIn.height,
                            pixels: imgIn.pixels
                        }
                    });
                });
            };
            sOut.draw = function() {
                sOut.background(0);
                sOut.image(imgOut, 0, 0);
            };
        }, document.getElementById('sketch-out'));
    };
    sIn.draw = function() {
        sIn.background(0);
        sIn.image(imgIn, 0, 0);
    };
}, document.getElementById('sketch-in'));


updateKernel(kernelSelect.value);
kernelSelect.addEventListener('change', (event) => {
    updateKernel(kernelSelect.value);
});
