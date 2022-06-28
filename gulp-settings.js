const devDir = 'dev';
const publicDir = 'public';

module.exports = {
	publicDir,
	devDir,
	assetsDir: `${devDir}/assets`,
	imagesDir: {
		entry: `${publicDir}/images`,
		output: `${publicDir}/images`
	},
	scssDir: {
		entry: `${devDir}/scss`,
		output: `${publicDir}/css`,
		mainFileName: 'style',
		mainFileOutput: publicDir
	},
	pugDir: {
		entry: devDir,
		output: publicDir
	},
	jsDir: {
		entry: `${devDir}/js`,
		output: `${publicDir}/js`
	}
};
