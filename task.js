self.addEventListener('message', (event) => {
    self.postMessage('I got it!')
    console.log(event)
});
