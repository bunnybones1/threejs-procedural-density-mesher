var idCounter = 0;

function Face(edge1, edge2, edge3, flip) {
	this.edges = flip ? [edge1, edge2, edge3] : [edge3, edge2, edge1];
	this.validateEdges();
	var _this = this;
	this.edges.forEach(function(edge){
		edge.addFace(_this);
	})
	this.normal = new THREE.Vector3(0, 1, 0);
	this.id = idCounter;
	idCounter++;
}

Face.prototype = {
	validateEdges: function() {
		var verts = [];
		this.edges.forEach(function(edge) {
			if(verts.indexOf(edge.v1) == -1) verts.push(edge.v1);
			if(verts.indexOf(edge.v2) == -1) verts.push(edge.v2);
		});
		if(verts.length !== 3) throw new Error('wtf');
		verts.sort(function(a, b) {
			return a.id - b.id;
		});
		this.validId = verts[0].id + ':' + verts[1].id + ':' + verts[2].id;
		// console.log('validId', this.validId);
	},
	getVerts: function() {
		return [
			this.edges[0].getSharedVertex(this.edges[1]),
			this.edges[1].getSharedVertex(this.edges[2]),
			this.edges[2].getSharedVertex(this.edges[0])
		];
	},
	getFace3: function(vertices) {
		var verts = this.getVerts();
		return new THREE.Face3(verts[0], verts[1], verts[2]);
	},
	getPrevEdge: function(edge) {
		return this.edges[(this.edges.indexOf(edge)+2)%3];
	},
	getNextEdge: function(edge) {
		return this.edges[(this.edges.indexOf(edge)+1)%3];
	},
	getVertexOpposingEdge: function(edge) {
		// console.log('face:', this.edges[0].id, this.edges[1].id, this.edges[2].id);
		// console.log('opposing', edge.id);
		if(this.edges.length !== 3) throw new Error('wtf');
		return this.getNextEdge(edge).getUnsharedVertex(edge);
	},
	removeItselfFromEdges: function() {
		var _this = this;
		this.edges.forEach(function(edge){
			edge.removeFace(_this);
		})
		this.edges = [];
	},
	computeNormal: function() {
		var cb = new THREE.Vector3(), ab = new THREE.Vector3();
		return function() {
			var verts = this.getVerts();

			cb.subVectors( verts[2], verts[1] );
			ab.subVectors( verts[0], verts[1] );
			cb.cross( ab );

			cb.normalize();
			// var backup = [verts[0].x,verts[0].y, verts[0].z, verts[1].x,verts[1].y, verts[1].z, verts[2].x,verts[2].y, verts[2].z];
			// if(debug && (cb.x != this.normal.x || cb.y != this.normal.y || cb.z != this.normal.z)) debugger;
			// if(this.backup) {
			// 	var match = true;
			// 	for (var i = 0; i < backup.length; i++) {
			// 		if(backup[i] != this.backup[i]) {
			// 			match = false;
			// 			break;
			// 		}
			// 	};
			// 	var matchNorm = this.normal.x == cb.x && this.normal.y == cb.y && this.normal.z == cb.z;
			// 	console.log(match ? 'verts same' : 'verts diff');
			// 	console.log(matchNorm ? 'normal same' : 'normal diff');
			// }
			// this.backup = backup;
			this.normal.copy( cb );
		}
	}(),
	reverseEdges: function() {
		this.edges.reverse();
	}
}
module.exports = Face;