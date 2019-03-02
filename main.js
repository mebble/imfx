if (window.Worker) {
    const worker = new Worker('task.js')
    worker.addEventListener('message', (eee) => {
        console.log(eee)
    })
    worker.postMessage({ cookie: 'i love it' })
}

let img;
function preload() {
    img = loadImage('cat-hat.jpeg');
}

function setup() {
    createCanvas(img.width, img.height);
}

function draw() {
    background(0);
    image(img, 0, 0);
}

function keyPressed() {
    if (keyCode === 32) {
        img.loadPixels();

        kernel = Kernel([
            [1, 2, 1],
            [2, 1, 2],
            [1, 2, 1]
        ]);

        for (let x = 1; x < img.width-1; x++) {
            for (let y = 1; y < img.height-1; y++) {
                for (let i = 0; i < 3; i++) {
                    const pixels = pixelsAround(x, y, i);
                    const zip = _.zipWith(kernel.array, pixels, (k, p) => k * p);
                    const sum = _.sum(zip);
                    const newPixel = sum / kernel.scale;
                    img.pixels[loc(x, y, img.width) + i] = newPixel;
                }
            }
        }
        img.updatePixels();
        console.log('did it')
    }
}

function Kernel(squareMatrix) {
    const array = _.flatten(squareMatrix);
    return {
        array,
        scale: _.sum(array)
    };
}

function pixelsAround(x, y, i) {
    /** 
     * To be called only after img.loadPixels() has been called
    */
    const pos = [
        [x-1, y-1], [x, y-1], [x+1, y-1],
        [x-1, y],   [x, y],   [x+1, y],
        [x-1, y+1], [x, y+1], [x+1, y+1]
    ];
    return _.map(pos, ([a, b]) => img.pixels[loc(a, b, img.width) + i]);
}

function loc(x, y, rowLen) {
    return 4 * x + 4 * y * rowLen;
}
