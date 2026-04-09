// To read a story's text.json file and print the concatenated story text to be used 
const fs = require('fs');
const { argv } = require('process');

console.log(argv[2]);
const content = fs.readFileSync(argv[2]);
console.log(content);
const storyObj = JSON.parse(content);
storyObj.pages.forEach(page => {
    console.log(page.storyText);
});
