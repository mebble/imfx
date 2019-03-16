const p5 = require('p5');
const _ = require('lodash');

if (window.Worker) {
    const worker = new Worker('task.js')
    worker.addEventListener('message', (eee) => {
        console.log(eee)
    })
    worker.postMessage({ cookie: 'i love it' })
}

let img;
let newImg;
const sketch = new p5(function(self) {
    self.preload = function() {
        img = self.loadImage('images/bones-building.jpeg');
    };
    self.setup = function() {
        self.createCanvas(2 * img.width, img.height);
        newImg = self.createImage(img.width, img.height);
    };
    self.draw = function() {
        self.background(0);
        self.image(img, 0, 0);
        self.image(newImg, img.width, 0);
    };
    self.keyPressed = function() {
        if (self.keyCode === 32) {
            img.loadPixels();
            newImg.loadPixels();

            const kernel = Kernel([
                [-2, -1, 0],
                [-1, 1, 1],
                [0, 1, 2]
            ]);

            for (let x = 0; x < img.width; x++) {
                for (let y = 0; y < img.height; y++) {
                    const newPixelChannels = [];
                    for (let i = 0; i < 3; i++) {
                        const pixels = pixelsAround(img, x, y, i);
                        const zip = _.zipWith(kernel.array, pixels, (k, p) => k * p);
                        const sum = _.sum(zip);
                        const newPixel = sum / kernel.scale;
                        newPixelChannels.push(newPixel);
                    }
                    newImg.set(x, y, [...newPixelChannels, 255]);
                }
            }
            img.updatePixels();
            newImg.updatePixels();
            console.log('did it')
        }
    }
});

function Kernel(squareMatrix) {
    const array = _.flatten(squareMatrix);
    return {
        array,
        scale: _.sum(array)
    };
}

function pixelsAround(img, x, y, i) {
    /** 
     * To be called only after img.loadPixels() has been called
    */
    const pos = [
        [x-1, y-1], [x, y-1], [x+1, y-1],
        [x-1, y],   [x, y],   [x+1, y],
        [x-1, y+1], [x, y+1], [x+1, y+1]
    ];
    return _.map(pos, ([a, b]) => {
        if (a < 0 || b < 0 || a >= img.width || b >= img.height) {
            return 0;
        }
        return img.pixels[loc(a, b, img.width) + i];
    });
}

function loc(x, y, rowLen) {
    return 4 * x + 4 * y * rowLen;
}
