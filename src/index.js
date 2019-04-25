import p5 from 'p5';
import { parseKernel, updateKernel, parseToCustom } from './kernel';
import { posToIndex } from './utils';

import images from './../assets/images/*.jpeg';

if (!window.Worker) {
    console.log("You don't have workers, sorry!");
}

const applyBtn = document.getElementById('apply-kernel-btn');
const workers = [
    new Worker('task.js'),
    new Worker('task.js'),
    new Worker('task.js'),
    new Worker('task.js'),
];
let running = 0;

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

                    const handleMessage = (event) => {
                        const toIndex = posToIndex(imgOut.width);

                        const { newImage, xOff, yOff } = event.data;
                        for (const [x, y, channels] of newImage) {
                            const index = toIndex(xOff + x, yOff + y);
                            imgOut.pixels[index + 0] = channels[0];
                            imgOut.pixels[index + 1] = channels[1];
                            imgOut.pixels[index + 2] = channels[2];
                            imgOut.pixels[index + 3] = channels[3];
                        }
                        running -= 1;
                        if (running === 0) {
                            // end cycle: loadPixels -> post image -> get new image -> updatePixels
                            imgOut.updatePixels();
                            console.timeEnd('Filter time');
                            applyBtn.disabled = false;
                        }
                    };
                    for (const worker of workers) {
                        worker.addEventListener('message', handleMessage);
                    }

                    applyBtn.addEventListener('click', (event) => {
                        applyBtn.disabled = true;
                        const partitions = getPartitions(imgIn);
                        const kernel = parseKernel();

                        for (let i = 0; i < workers.length; i++) {
                            const [xOff, yOff, w, h] = partitions[i];
                            const worker = workers[i];

                            const subImg = imgIn.get(xOff, yOff, w, h);
                            subImg.loadPixels();
                            worker.postMessage({
                                op: 'spatial-filter',
                                kernel,
                                xOff,
                                yOff,
                                image: {
                                    width: subImg.width,
                                    height: subImg.height,
                                    pixels: subImg.pixels,
                                }
                            });
                            subImg.updatePixels();
                            running += 1;
                        }
                        // begin cycle: loadPixels -> post image -> get new image -> updatePixels
                        imgOut.loadPixels();  // loadPixels on imgOut once, and repeatedly update imgOut.pixels array. Then updatePixels once.
                        console.time('Filter time');
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
