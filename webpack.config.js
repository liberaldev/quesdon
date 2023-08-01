const webpack = require("webpack")
const TerserPlugin = require("terser-webpack-plugin")
const isProduction = process.env.NODE_ENV == "production"

module.exports = {
    mode: isProduction ? "production": "development",

    entry: "./src/client/index.ts",
    output: {
        path: __dirname+"/dist/client",
        filename: "bundle.js",
        publicPath: "/assets/",
    },
    devServer: {
        contentBase: "dist/client",
        proxy: {
            "/": "http://localhost:"+(process.env.BACK_PORT || 3000)
        },
    },
    plugins: [
        new webpack.ProvidePlugin({
            "$": "jquery",
            apiFetch: __dirname+"/src/client/api-fetch.ts"
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ],
    module: {
        rules: [
            {test: /\.css$/, use: ['style-loader', 'css-loader']},
            {test: /\.(woff2?|ttf|eot|svg)$/, loader: 'file-loader'},
            {test: /\.tsx?$/, use: isProduction ? ['babel-loader',' ts-loader'] : ['ts-loader']},
        ]
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    optimization: {
        minimizer: isProduction ? [
            new TerserPlugin({
                terserOptions: {
                    keep_classnames: true
                }
            })
        ]: []
    }
}

// if (process.env.NODE_ENV == "production") {
//     module.exports.plugins.push(new UglifyJsPlugin({
//     }))
// }