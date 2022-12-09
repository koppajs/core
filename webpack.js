const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        main: path.resolve(__dirname, './src/index.js')
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'koppa-core.2.0.7.min.js',
        clean: true,
        library: {
            type: 'umd',
            name: 'koppajs-core'
        }
    }
};
