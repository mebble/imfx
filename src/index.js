import p5 from 'p5';
import { parseKernel, updateKernel, parseToCustom } from './kernel';
import { posToIndex } from './utils';

import images from './../assets/images/*.jpeg';

if (!window.Worker) {
    console.log("You don't have workers, sorry!");
}

const worker = new Worker('task.js');

let imgIn;
let imgOut;
let sketchIn;
let sketchOut;

const imageSelect = document.getElementById('image-select');
newImageSketch(imageSelect.value, true);
imageSelect.addEventListener('change', (event) => {
    cleanCanvases();
    newImageSketch(imageSelect.value, false);
});

const kernelSelect = document.getElementById('kernel-select');
updateKernel(kernelSelect.value);
kernelSelect.addEventListener('change', (event) => {
    updateKernel(kernelSelect.value);
});

const kernelTable = document.getElementById('kernel-table');
kernelTable.addEventListener('input', (event) => {
    kernelSelect.value = 'Custom';
    parseToCustom();
});

function newImageSketch(imageName, firstImage) {
    sketchIn = new p5(sIn => {
        sIn.preload = () => {
            imgIn = sIn.loadImage(images[imageName]);
        };
        sIn.setup = () => {
            sIn.createCanvas(imgIn.width, imgIn.height);
            sketchOut = new p5(sOut => {
                sOut.setup = () => {
                    sOut.createCanvas(imgIn.width, imgIn.height);
                    imgOut = sOut.createImage(imgIn.width, imgIn.height);

                    /**
                     * init listeneres only when:
                     * - imgIn and imgOut have been defined
                     * - this is just the first image that's loaded
                     */
                    if (!firstImage) return;

                    worker.addEventListener('message', (event) => {
                        const toIndex = posToIndex(imgOut.width);

                        const { newImage } = event.data;
                        for (const [x, y, channels] of newImage) {
                            const index = toIndex(x, y);
                            imgOut.pixels[index + 0] = channels[0];
                            imgOut.pixels[index + 1] = channels[1];
                            imgOut.pixels[index + 2] = channels[2];
                            imgOut.pixels[index + 3] = channels[3];
                        }

                        // end cycle: loadPixels -> post image -> get new image -> updatePixels
                        imgIn.updatePixels();
                        imgOut.updatePixels();
                        console.timeEnd('filter time:');
                        applyBtn.disabled = false;
                    });

                    const applyBtn = document.getElementById('apply-kernel-btn');
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
                        console.time('filter time:');
                    });
                };
                sOut.draw = function () {
                    sOut.background(0);
                    sOut.image(imgOut, 0, 0);
                };
            }, 'sketch-out');
        };
        sIn.draw = function () {
            sIn.background(0);
            sIn.image(imgIn, 0, 0);
        };
    }, 'sketch-in');
};

function cleanCanvases() {
    const sketchInDiv = document.getElementById('sketch-in');
    const sketchOutDiv = document.getElementById('sketch-out');
    while (sketchInDiv.firstChild) {
        sketchInDiv.removeChild(sketchInDiv.firstChild);
    }
    while (sketchOutDiv.firstChild) {
        sketchOutDiv.removeChild(sketchOutDiv.firstChild);
    }
}
