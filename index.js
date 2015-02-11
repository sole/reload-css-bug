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
			.then(makeEverythingHappen);
	});
});

function makeEverythingHappen(simulator) {

	var client;

	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			console.log('nao');
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
		console.log('find apps', apps);
		if(apps.length === 0) {
			return installApp({
				appPath: appPath,
				client: client
			}).then(function(res) {
				console.log('was it installed?', res);
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
		console.log('and FINALLY', apps.length);
		if(apps.length === 0) {
			throw(new Error('What IS going on?'));
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
		console.log('launch app', app);

		client.getWebapps(function(err, actor) {
			if(err) {
				throw(new Error(err));
			}
			
			actor.getApp(app.manifestURL, function(err, tab) {
				if(err) {
					throw(new Error(err));
				}

				startUpdatingStylesheets(tab);

			});

		});

	})
	.catch(function(horror) {
		console.error('THIS IS TERRIBLE', horror);
	});
}

function onError(agh) {
	console.error('OH NO', agh);
}

function startUpdatingStylesheets(tab) {

	tab.StyleSheets.getStyleSheets(function(err, sheets) {
		if(err) {
			return onError(err);
		}

		var firstSheet = sheets[0];

		firstSheet.update('body { background: #f00; }');

		/*setInterval(function() {
			
		}, 1000);*/

	});
	
}
