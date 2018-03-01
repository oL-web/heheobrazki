const chalk = require("chalk");

module.exports = function (text) {
	if(typeof text === "object") console.dir(text, {colors: true}); 
    else console.log(chalk.black.bgWhiteBright(text));
};