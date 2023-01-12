const devDir = './src';
const publicDir = './dist';
const wpDir = '../wp-content/themes/theme_name_folder'; //path to theme root folder

module.exports = {
	publicDir,
	devDir,
	wpDir,
	isWP: false,
	isPug: true,
	assetsDir: {
		entry: `${devDir}/assets`,
		output: publicDir
	},
	viewsDir: {
		entry: `${devDir}/views`,
		output: publicDir
	},
	imagesDir: {
		entry: `${devDir}/assets/images`,
		output: `${publicDir}/images`
	},
	scssDir: {
		entry: `${devDir}/styles`,
		output: `${publicDir}/css`,
		mainFileName: 'style'
	},
	pugDir: {
		entry: `${devDir}/views`,
		output: publicDir
	},
	jsDir: {
		entry: `${devDir}/js`,
		output: `${publicDir}/js`
	}
};
