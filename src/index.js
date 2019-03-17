const p5 = require('p5');
const _ = require('lodash');

if (!window.Worker) {
    console.log("You don't have workers, sorry!");
}

const worker = new Worker('task.js');

let imgIn;
let imgOut;
const sketch = new p5(function(self) {
    self.preload = function() {
        imgIn = self.loadImage('images/cat-hat.jpeg');
    };
    self.setup = function() {
        self.createCanvas(2 * imgIn.width, imgIn.height);
        imgOut = self.createImage(imgIn.width, imgIn.height);
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
    self.draw = function() {
        self.background(0);
        self.image(imgIn, 0, 0);
        self.image(imgOut, imgIn.width, 0);
    };
    self.keyPressed = function() {
        if (self.keyCode === 32) {
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
});
