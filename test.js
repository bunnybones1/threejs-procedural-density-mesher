var ManagedView = require('threejs-managed-view');
var loadAndRunScripts = require('loadandrunscripts');

loadAndRunScripts(
	[
		'bower_components/three.js/three.js',
		'lib/stats.min.js',
		'lib/threex.rendererstats.js'
	],
	function() {

		var Mesher = require('./');
		var PlanetDensity = require('procedural-planet');
		var view = new ManagedView.View({
			stats: true
		});
		view.renderManager.skipFrames = 10;

		var planetDensity = new PlanetDensity({
			inner: .5,
			outer: .8,
			density: 4
		});

		var mesher = new Mesher(.25, 300, planetDensity.sample);
		var light = new THREE.HemisphereLight(0x8faf5f, 0x7f4f3f, 1);
		view.scene.add(light);

		var planet = new THREE.Mesh(
			mesher.createGeometry(),
			new THREE.MeshPhongMaterial({
				color: 0xef7f7f,
				// shading: THREE.FlatShading,
				shininess: 50,
				// wireframe: true
			})
		)
		view.scene.add(planet);
		view.renderManager.onEnterFrame.add(function() {
			planet.rotation.y += .2;
			planet.rotation.z += .2;
		})
	}
)