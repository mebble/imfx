const p5 = require('p5');

if (!window.Worker) {
    console.log("You don't have workers, sorry!");
}

const worker = new Worker('task.js');
let imgIn;
let imgOut;
let sketchIn;
let sketchOut;

sketchIn = new p5(function(sIn) {
    sIn.preload = function() {
        imgIn = sIn.loadImage('images/bones-building.jpeg');
    };
    sIn.setup = function() {
        sIn.createCanvas(imgIn.width, imgIn.height);
        sketchOut = new p5(function(sOut) {
            sOut.setup = function() {
                sOut.createCanvas(imgIn.width, imgIn.height);
                imgOut = sOut.createImage(imgIn.width, imgIn.height);
                worker.addEventListener('message', (event) => {
                    const { newImage } = event.data;
                    for (const [x, y, channels] of newImage) {
                        imgOut.set(x, y, channels);
                    }
                    // end cycle: loadPixels -> post image -> get new image -> updatePixels
                    imgIn.updatePixels();
                    imgOut.updatePixels();
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
    sIn.keyPressed = function() {
        if (sIn.keyCode === 32) {
            // begin cycle: loadPixels -> post image -> get new image -> updatePixels
            imgIn.loadPixels();
            imgOut.loadPixels();

            worker.postMessage({
                kernelData: [
                    [-2, -1, 0],
                    [-1, 1, 1],
                    [0, 1, 2]
                ],
                image: {
                    width: imgIn.width,
                    height: imgIn.height,
                    pixels: imgIn.pixels
                }
            });
        }
    }
}, document.getElementById('sketch-in'));
