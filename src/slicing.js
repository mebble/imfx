import p5 from 'p5';
import { posToIndex } from './utils';

import images from './../assets/images/*.jpeg';

if (!window.Worker) {
    console.log("You don't have workers, sorry!");
}

const applyBtn = document.getElementById('apply-slicing-btn');
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

const bitInput = document.getElementById('bit-input');
const bitInputDisp = document.getElementById('bit-input-disp');
bitInputDisp.textContent = bitInput.value;
bitInput.addEventListener('change', (event) => {
    bitInputDisp.textContent = bitInput.value;
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

                    worker.addEventListener('message', event => {
                        const { newImage } = event.data;
                        for (let i = 0; i < newImage.pixels.length; i++) {
                            imgOut.pixels[i] = newImage.pixels[i];
                        }
                        
                        // end cycle: loadPixels -> post image -> get new image -> updatePixels
                        imgOut.updatePixels();
                        console.timeEnd('Slicing time');
                        applyBtn.disabled = false;
                    });

                    applyBtn.addEventListener('click', (event) => {
                        applyBtn.disabled = true;
                        const bitIndex = parseInt(bitInput.value);
                        if (isNaN(bitIndex)) {
                            applyBtn.disabled = false;
                            return;
                        }

                        imgIn.loadPixels();
                        worker.postMessage({
                            op: 'bit-plane-slicing',
                            bitIndex,
                            image: {
                                width: imgIn.width,
                                height: imgIn.height,
                                pixels: imgIn.pixels,
                            }
                        });
                        imgIn.updatePixels();

                        // begin cycle: loadPixels -> post image -> get new image -> updatePixels
                        imgOut.loadPixels();
                        console.time('Slicing time');
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

function getPartitions(image) {
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
}
