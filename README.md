# reload-css-bug

A test case for bug [#1](https://github.com/mozilla/node-firefox-reload-css/issues/1) from  [`node-firefox`](https://github.com/mozilla/node-firefox-reload-css).

## Usage

Clone the repository, `cd` to its folder and run `npm install`. Then you can just run `node index.js` to get the app in the `app` folder deployed to all your installed Firefox OS simulators. The script will try to update the first stylesheet in the app and set it to "body{ background: #f00; }" but it only works on 2.0 simulators right now.
