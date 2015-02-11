'use strict';

var fs = require('fs');
var path = require('path');
var findSimulators = require('node-firefox-find-simulators');
var startSimulator = require('node-firefox-start-simulator');
var connect = require('node-firefox-connect');
var installApp = require('node-firefox-install-app');
var findApp = require('node-firefox-find-app');
var launchApp = require('node-firefox-launch-app');
var Promise = require('es6-promise').Promise;


var appPath = path.join(__dirname, 'app');
var manifestPath = path.join(appPath, 'manifest.webapp');
var manifestContents = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
var cssPath = path.join(appPath, 'style.css');
var cssContents = fs.readFileSync(cssPath, 'utf8');

// Launch all of them. ALL. OF. THEM.
findSimulators().then(function(results) {
	results.forEach(function(simu) {
		startSimulator({ version: simu.version })
			.then(function(simulator) {
				simulator.version = simu.version;
				return makeEverythingHappen(simulator);
			});
	});
});

function makeEverythingHappen(simulator) {

	var client;
	var version = simulator.version;

	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			console.log(version, 'Connect now');
			resolve(connect(simulator.port));
		}, 1000);
	})
	.then(function(c) {
		
		client = c;

		return findApp({
			manifest: manifestContents,
			client: client
		});

	}, onError)
	.then(function(apps) {
		console.log(version, 'find apps', apps.length);
		if(apps.length === 0) {
			return installApp({
				appPath: appPath,
				client: client
			}).then(function(res) {
				console.log(version, 'was it installed?', res);
				return findApp({
					manifest: manifestContents,
					client: client
				});
			});
		} else {
			return apps;
		}
	}, onError)
	.then(function(apps) {
		console.log(version, 'and FINALLY', apps.length);
		if(apps.length === 0) {
			throw(new Error(version + ': what IS going on?'));
		}
		var app = apps[0];
		return launchApp({
			manifestURL: app.manifestURL,
			client: client
		}).then(function() {
			return app;
		});
	})
	.then(function(app) {
		console.log(version, 'launch app', app.name);

		client.getWebapps(function(err, actor) {
			if(err) {
				throw(new Error({ version: version, error: err }));
			}
			
			actor.getApp(app.manifestURL, function(err, tab) {
				if(err) {
					throw(new Error({ version: version, error: err }));
				}

				updateStyleSheet(tab, version);

			});

		});

	})
	.catch(function(horror) {
		console.error(version, 'THIS IS TERRIBLE', horror);
	});
}

function onError(agh) {
	console.error('OH NO', agh);
}

function updateStyleSheet(tab, version) {

	console.log(version, 'updateStyleSheet / tab has StyleSheets?', !!tab.StyleSheets);

	tab.StyleSheets.getStyleSheets(function(err, sheets) {
		if(err) {
			return onError(err);
		}

		console.log(version, '☑️   got stylesheets');

		var firstSheet = sheets[0];

		firstSheet.update('body { background: #f00; }', function(err, res) {
			console.log(version, '✅  updated css =>', err, res);
		});

	});
	
}
