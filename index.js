var GeometryGeneratorTetraHedron = require('./GeometryGeneratorTetraHedron');
function Mesher(seedRadius, divisions, densityLookup, iterations) {
	this.geometryGenerator = new GeometryGeneratorTetraHedron(seedRadius, divisions, densityLookup, iterations);
}

Mesher.prototype = {
	createGeometry: function() {
		var geom = new THREE.Geometry();
		geom.vertices = this.geometryGenerator.collectVertices();
		geom.faces = this.geometryGenerator.collectFaces();
		geom.computeFaceNormals();
		geom.computeVertexNormals();
		return geom;
	}
}
module.exports = Mesher;