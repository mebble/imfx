import p5 from 'p5';
import { parseKernel, updateKernel } from './kernel.js';
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
                        const { newImage } = event.data;
                        for (const [x, y, channels] of newImage) {
                            imgOut.set(x, y, channels);
                        }
                        // end cycle: loadPixels -> post image -> get new image -> updatePixels
                        imgIn.updatePixels();
                        imgOut.updatePixels();

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
