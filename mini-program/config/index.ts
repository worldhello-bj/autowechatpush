import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import { UnifiedViteWeappTailwindcssPlugin } from 'weapp-tailwindcss/vite'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

import devConfig from './dev'
import prodConfig from './prod'

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<'vite'>(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<'vite'> = {
    projectName: 'mini-program',
    date: '2026-1-26',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    alias: {
      '@shared': path.resolve(__dirname, '..', '../shared/src'),
      '@': path.resolve(__dirname, '..', 'src')
    },
    plugins: [
      "@tarojs/plugin-generator"
    ],
    defineConstants: {
      'process.env.TARO_APP_API_BASE': JSON.stringify(process.env.TARO_APP_API_BASE || 'https://www.aiwxcreator.cloud/api/v1'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    copy: {
      patterns: [
      ],
      options: {
      }
    },
    framework: 'react',
    compiler: {
      type: 'vite',
      vitePlugins: [
        UnifiedViteWeappTailwindcssPlugin({
          rem2rpx: true,
          cssEntries: [path.resolve(__dirname, '..', 'src/app.scss')]
        }),
        {
          name: 'configure-postcss',
          config: () => ({
            css: {
              postcss: {
                plugins: [
                  tailwindcss(),
                  autoprefixer(),
                ]
              }
            }
          })
        }
      ]
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {

          }
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',

      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
    },
    rn: {
      appName: 'taroDemo',
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        }
      }
    }
  }


  if (process.env.NODE_ENV === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig)
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig)
})