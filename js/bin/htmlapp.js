var peg = require("pegjs");
var nunjucks = require("nunjucks");
var fs = require("fs-extra");
var path = require("path");
var build = require("./build").main;
var webpack = require('webpack');
var argparse = require("argparse");
// var UglifyJsPlugin = require('uglifyjs-webpack-plugin');

function main(args) {
    build();

    let base_path = path.resolve(path.join(__dirname, ".."));
    let src_path = path.join(base_path, "htmlapp_templates");
    let dest_path = path.resolve(args.dest_path);

    if(fs.existsSync(dest_path)) fs.removeSync(dest_path);
    fs.mkdirSync(dest_path);

    fs.copySync(src_path, dest_path);
    fs.removeSync(path.join(dest_path, "src/lawtext-app.js"));
    fs.removeSync(path.join(dest_path, "templates"));

    fs.copyFileSync(
        path.join(base_path, "lib/static/law.css"),
        path.join(dest_path, "src/law.css"),
    );

    let webpack_opt = {
        entry: path.join(src_path, "src/lawtext-app.js"),
        output: {
            path: path.join(dest_path, "src"),
            filename: "lawtext.min.js",
            libraryTarget: "window",
        },
        target: "web",
        node: {
            fs: "empty",
        },
        externals: {
            lodash: "_",
            nunjucks: "nunjucks",
            jszip: "JSZip",
            xmldom: "window",
            argparse: "window",
        },
    };

    if(args.dev) {
        webpack_opt = Object.assign(webpack_opt, {
            devtool: "source-map",
        });
    } else {
        webpack_opt = Object.assign(webpack_opt, {
            module: {
                rules: [
                    {
                        test: /\.(?:js|html)$/,
                        use: [
                            {
                                loader: 'babel-loader',
                                options: {
                                    presets: [
                                        ['env', {
                                            'modules': false,
                                            "targets": {
                                                "browsers": ["defaults"],
                                            }
                                        }],
                                    ],
                                },
                            },
                        ],
                        exclude: /node_modules/,
                    },
                ],
            },
            plugins: [
                new webpack.optimize.UglifyJsPlugin({
                    // sourceMap: true,
                    uglifyOptions: {ecma: 6},
                }),
            ],
        });
    }

    webpack(webpack_opt, (err, stats) => { if(err) throw err; });
}

if (typeof require !== "undefined" && require.main === module) {
    let argparser = new argparse.ArgumentParser();
    argparser.addArgument("dest_path");
    argparser.addArgument(
        ["-d", "--dev"],
        { action: "storeTrue"},
    );
    let args = argparser.parseArgs();
    main(args);
}
