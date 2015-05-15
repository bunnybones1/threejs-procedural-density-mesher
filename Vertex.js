var idCount = 0;
function Vertex(x, y, z) {
	THREE.Vector3.call(this, x, y, z);
	this.edges = [];
	this.normal = new THREE.Vector3();
	this.id = idCount;
	idCount++;
}

Vertex.prototype = Object.create(THREE.Vector3.prototype);

Vertex.prototype.addEdge = function(edge) {
	this.edges.push(edge);
}

Vertex.prototype.removeEdge = function(edge) {
	this.edges = this.edges.filter(function(e) {
		return edge !== e;
	})
}

Vertex.prototype.clone = function() {
	return new Vertex( this.x, this.y, this.z );
}

Vertex.prototype.computeNormal = function(areaWeighted) {
	var v, vl, f, fl, verts;
	var faces = [];
	this.edges.forEach(function(edge){
		edge.faces.forEach(function(face) {
			if(faces.indexOf(face) == -1) {
				faces.push(face);
			}
		});
	});
	this.normal.set(0, 0, 0);
	if ( areaWeighted) {

		// vertex normals weighted by triangle areas
		// http://www.iquilezles.org/www/articles/normals/normals.htm

		var cb = new THREE.Vector3(), ab = new THREE.Vector3(),
			db = new THREE.Vector3(), dc = new THREE.Vector3(), bc = new THREE.Vector3();

		for ( f = 0, fl = faces.length; f < fl; f ++ ) {

			verts = faces[ f ].getVerts();

			cb.subVectors( verts[2], verts[1] );
			ab.subVectors( verts[0], verts[1] );
			cb.cross( ab );

			this.normal.add( cb );

		}

	} else {

		for ( f = 0, fl = faces.length; f < fl; f ++ ) {
			this.normal.add( faces[ f ].normal );
		}

	}

	this.normal.normalize();

}

Vertex.prototype.translateAlongNormal = function(distance) {
	this.add(this.normal.clone().multiplyScalar(distance));
}

Vertex.prototype.findDensityThresh = function(densityModelSampler, threshold, tolerance) {
	// var maxOut = 25;
	var density;
	var threshLow = threshold - tolerance;
	var threshHigh = threshold + tolerance;
	var densityStable = false;

	var binarySearchScale = 0.001;
	var binarySearchDirection = 1;

	var binarySearchScaleScaleUp = 2;
	var binarySearchScaleScaleDown = .5;
	var binarySearchScaleScale = binarySearchScaleScaleUp;
	
	var binarySearchDensityFenceSideInner = 1;
	var binarySearchDensityFenceSideOuter = -1;
	var binarySearchDensityFenceSideUndetermined = 0;
	var binarySearchDensityFenceSide = binarySearchDensityFenceSideUndetermined;
	var lastBinarySearchDensityFenceSide = binarySearchDensityFenceSide;
	
	while(!densityStable) {
		// maxOut--;
		density = densityModelSampler(this.x, this.y, this.z);
		if(density >= threshHigh) {
			binarySearchDensityFenceSide = binarySearchDensityFenceSideInner;
		} else if(density <= threshLow) {
			binarySearchDensityFenceSide = binarySearchDensityFenceSideOuter;
		} else {
			densityStable = true;
			break;
		}
		if(lastBinarySearchDensityFenceSide === binarySearchDensityFenceSideUndetermined) {
			lastBinarySearchDensityFenceSide = binarySearchDensityFenceSide;
			if(lastBinarySearchDensityFenceSide === binarySearchDensityFenceSideOuter) {
				binarySearchDirection = -1;
			} else {
				binarySearchDirection = 1;
			}
		}

		if(lastBinarySearchDensityFenceSide != binarySearchDensityFenceSide) {
			binarySearchScaleScale = binarySearchScaleScaleDown;
			binarySearchDirection *= -1;
		}
		binarySearchScale *= binarySearchScaleScale;
		this.add(this.normal.clone().multiplyScalar(binarySearchDirection * binarySearchScale));
		lastBinarySearchDensityFenceSide = binarySearchDensityFenceSide;
		// if(maxOut==0) return;
	}
}
module.exports = Vertex;