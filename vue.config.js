// const autoprefixer = require('autoprefixer');
const PrerenderSPAPlugin = require('prerender-spa-plugin');
const Renderer = PrerenderSPAPlugin.PuppeteerRenderer;
// 2020-0910-wfc 分析打包結果
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin;
const path = require('path');
const staticDir = path.join(__dirname, 'dist', process.env.NODE_ENV);
// 2020-0910-wfc 是否prodution
// const IsProd = () => {
//     return (
//         process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production'
//     );
// };

// 檔案夾路徑
const indexPath = (contextPath) => {
    const array = contextPath.split(path.sep);
    let paths = [__dirname, 'dist', process.env.NODE_ENV];
    paths = paths.concat(array);
    paths = paths.concat('index.html');
    return path.join.apply(null, paths);
};
//router配置
const renderRouters = (contextPath) => {
    const routes = [
        '/',
        '/foreword',
        '/menu',
        '/medical/question1',
        '/life/question',
    ];
    return routes.map((r) => contextPath + r);
};
// 最小化
const terserSetting = (config) => {
    config.optimization.minimizer('terser').tap((args) => {
        args[0] = {
            test: /\.m?js(\?.*)?$/i,
            chunkFilter: () => true,
            warningsFilter: () => true,           
            extractComments: false, // 註釋是否單獨提取成一個文件
            sourceMap: true,
            cache: true,
            cacheKeys: (defaultCacheKeys) => defaultCacheKeys,
            parallel: true,
            include: undefined, // 對哪些文件生效
            exclude: undefined,
            minify: undefined, // 自定義minify函數
            // 完整參數見 https://github.com/terser/terser#minify-options
            terserOptions: {
                compress: {
                    arrows: true, // 轉換成箭頭函數
                    collapse_vars: false, // 可能有副作用，所以關掉
                    comparisons: true, // 簡化表達式，如：!(a <= b) → a > b
                    computed_props: true, // 計算變量轉換成常量，如：{["computed"]: 1} → {computed: 1}
                    drop_console: true, // 去除 console.* 函數
                    hoist_funs: false, // 函數提升聲明
                    hoist_props: false, // 常量對象屬性轉換成常量，如：var o={p:1, q:2}; f(o.p, o.q) → f(1, 2);
                    hoist_vars: false, // var聲明變量提升，關掉因為會增大輸出體積
                    inline: true, // 只有return語句的函數的調用變成inline調用，有以下幾個級別：0(false)，1，2，3(true)
                    loops: true, // 優化do, while, for循環，當條件可以靜態決定的時候
                    negate_iife: false, // 當返回值被丟棄的時候，取消立即調用函數表達式。
                    properties: false, // 用圓點操作符替換屬性訪問方式，如：foo["bar"] → foo.bar
                    reduce_funcs: false, // 舊選項
                    reduce_vars: true, // 變量賦值和使用時常量對象轉常量
                    switches: true, // 除去switch的重複分支和未使用部分
                    toplevel: false, // 扔掉頂級作用域中未被使用的函數和變量
                    typeofs: false, // 轉換typeof foo == "undefined" 為 foo === void 0，主要用於兼容IE10之前的瀏覽器
                    booleans: true, // 簡化布爾表達式，如：!!a ? b : c → a ? b : c
                    if_return: true, // 優化if/return 和 if/continue
                    sequences: true, // 使用逗號運算符連接連續的簡單語句，可以設置為正整數，以指定將生成的最大連續逗號序列數。默認200。
                    unused: true, // 扔掉未被使用的函數和變量
                    conditionals: true, // 優化if語句和條件表達式
                    dead_code: true, // 扔掉未被使用的代碼
                    evaluate: true, // 嘗試計算常量表達式
                    // passes: 2, // compress的最大運行次數，默認是1，如果不在乎執行時間可以調高
                },
                mangle: {
                    safari10: true,
                },
            },
        };
        return args;
    });
};
// 載入檔切分，網頁SSR優化
const optimizationSetting = (config) => {
    config.optimization.splitChunks({
        // 增加公共代碼分片數量
        maxInitialRequests: 5, //默认3
        maxAsyncRequests: 6, //默认5
        cacheGroups: {
            // 增加一个cacheGroup，echarts太大了，jquery也笨重笨重好像沒用到
            jquery: {
                name: 'chunk-jquery',
                test: /[\\/]node_modules[\\/]jquery[\\/]/,
                priority: 0,
                chunks: 'all',
            },
            echarts: {
                name: 'chunk-echarts',
                test: /[\\/]node_modules[\\/]echarts[\\/]/,
                priority: 0,
                chunks: 'all',
            },
            zrender: {
                name: 'chunk-zrender',
                test: /[\\/]node_modules[\\/]zrender[\\/]/,
                priority: 0,
                chunks: 'all',
            },
            vendors: {
                name: 'chunk-vendors',
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
                // 增加下面两行，只被引用了一次的庫沒有提取的必要，結果會增加大小但是性能會增加
                minChunks: 2,
                chunks: 'all',
            },
            common: {
                name: 'chunk-common',
                minChunks: 2,
                priority: -20,
                chunks: 'initial',
                reuseExistingChunk: true,
            },
        },
    });
};
module.exports = {
    chainWebpack: (config) => {
        if (process.env.NODE_ENV === 'production') {
            console.log('性能優化喔');
            optimizationSetting(config);
            terserSetting(config);
        }
    },
    configureWebpack: () => {
        if (process.env.NODE_ENV !== 'production') {
            return;
        }
        return {
            plugins: [
                new PrerenderSPAPlugin({
                    staticDir: staticDir, // 文件生成路徑(打包後的路徑)
                    indexPath: indexPath(process.env.VUE_APP_CONTEXT_PATH), // 模板頁面
                    routes: renderRouters(process.env.VUE_APP_CONTEXT_PATH), // 預渲染的頁面路由
                    renderer: new Renderer({
                        inject: {
                            disableGTM: true,
                        },
                        headless: false,
                        renderAfterDocumentEvent: 'render-event', // document.dispatchEvent(new Event('render-event')) 的事件名稱。
                    }),
                }),
                new BundleAnalyzerPlugin(),
            ],
        };
    },
    devServer: {
        open: true,
        host: 'localhost', // 設置主機地址
        port: 8080, // 設置默認埠號
        https: false,
        proxy: {
            //配置跨域
            '/api': {
                target: 'http://localhost:8080', // 後台api
                ws: true, // 如果要代理 websockets
                changOrigin: true, //允許跨域
                pathRewrite: {
                    '^/api': '', //請求的時候使用這個api就可以
                },
            },
        },
        disableHostCheck: true,
    },
    
};
