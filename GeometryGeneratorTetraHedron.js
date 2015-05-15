var Vertex = require('./Vertex');
var Edge = require('./Edge');
var Face = require('./Face');

var areaWeighted = true;
function GeometryGeneratorTetraHedron(size, divisions, densityModelSampler) {
	size = size || 1;
	this.vertices = [];
	this.edges = [];
	this.faces = [];
	this.densityModelSampler = densityModelSampler;

	var topLeft = this.createVertex(-size, -size, 0);		//Top Left
	var topRight = this.createVertex(size, -size, 0);		//Top Right
	var bottomRear = this.createVertex(0, size, -size);	//Bottom Rear
	var bottomFront = this.createVertex(0, size, size);	//Bottom Front

	var topEdge = this.createEdge(topLeft, topRight);
	var bottomEdge = this.createEdge(bottomRear, bottomFront);
	var rearLeftEdge = this.createEdge(topLeft, bottomRear);
	var rearRightEdge = this.createEdge(topRight, bottomRear);
	var frontLeftEdge = this.createEdge(topLeft, bottomFront);
	var frontRightEdge = this.createEdge(topRight, bottomFront);

	this.createFace(topEdge, rearLeftEdge, rearRightEdge, true);
	this.createFace(topEdge, frontLeftEdge, frontRightEdge);
	this.createFace(bottomEdge, frontLeftEdge, rearLeftEdge);
	this.createFace(bottomEdge, frontRightEdge, rearRightEdge, true);

	var len = topEdge.getLength();
	// this.splitEdge(topEdge);
	// this.splitEdge(bottomEdge);
	// this.splitEdge(rearLeftEdge);
	// this.splitEdge(rearRightEdge);
	// this.splitEdge(frontLeftEdge);
	// this.splitEdge(frontRightEdge);
	// return;

	this.edges.forEach(function(edge){
		edge.getLength();
	})

	this.updateNormals();

	this.vertices.forEach(function(vertex) {
		vertex.findDensityThresh(densityModelSampler, .99, .01);
	})

	var maxOutIterations = 1000;
	var maxEdgeLength = .02;

	var longEdgesCount;
	var _this = this;

	function countLongEdges() {
		longEdgesCount = 0;
		_this.edges.forEach(function(edge){
			if(edge.getLength() > maxEdgeLength) {
				longEdgesCount++;
			}
		})
	}

	countLongEdges();

	var ratioOfLongestEdges = .35;
	function splitEdgesLongerThan(length) {
		_this.edges.sort(function(a, b) {
			return b.length - a.length;
		});
		for (var i = 1; i >= 0; i--) {
			if(_this.edges[i].length > length) {
				_this.splitEdge(_this.edges[i]);
			}
		};
	}

	function retriangulate() {
		for (var i = 0; i < _this.edges.length; i++) {
			_this.retriangulateEdge(_this.edges[i]);
		};
	}

	while(maxOutIterations > 0 && longEdgesCount > 0){
		maxOutIterations--;
		splitEdgesLongerThan(maxEdgeLength);
		this.updateNormals();
		this.vertices.forEach(function(vertex) {
			vertex.findDensityThresh(densityModelSampler, .99, .01);
		})
		retriangulate();
		countLongEdges();
		// console.log(longEdgesCount);
	}
	// this.faces.forEach(function(face) {
	// 	face.computeNormal();
	// })
	// console.log('!');

	// this.vertices[3].computeNormal(areaWeighted);
	// this.vertices[3].translateAlongNormal(1);
	// this.faces.forEach(function(face) {
		// face.computeNormal();
	// })

	// console.log('!');
	// this.vertices[3].computeNormal(areaWeighted);
	// this.vertices[3].translateAlongNormal(1);


	// 	for (var i = 0, total = divisions; i < total; i++) {
	// 		this.edges.sort(function(a, b) {
	// 			return b.length - a.length;
	// 		});
	// 		this.splitEdge(this.edges[0]);
	// 	};

	// 	this.faces.forEach(function(face) {
	// 		face.computeNormal();
	// 	})

	
}
GeometryGeneratorTetraHedron.prototype = {
	createVertex: function(x, y, z) {
		var vert = new Vertex(x, y, z);
		this.vertices.push(vert);
		return vert;
	},
	createEdge: function(v1, v2) {
		var edge = new Edge(v1, v2);
		var edgeAlreadyExists = this.edges.some(function(oldEdge){
			return (oldEdge.validId == edge.validId);
		})
		if(edgeAlreadyExists) {
			var justAsGood;
			this.edges.forEach(function(oldEdge){
				if(oldEdge.validId == edge.validId) {
					justAsGood = oldEdge;
				}
			})
			// throw new Error('wtf');
			if(justAsGood) {
				edge.removeItselfFromVertices();
				return justAsGood;
			}
		}
		this.edges.push(edge);
		return edge;
	},
	createFace: function(e1, e2, e3, flip) {
		var face = new Face(e1, e2, e3, flip);
		var faceAlreadyExists = this.faces.some(function(oldFace){
			return (oldFace.validId == face.validId);
		})
		if(faceAlreadyExists) {
			var justAsGood;
			this.faces.forEach(function(oldFace){
				if(oldFace.validId == face.validId) {
					justAsGood = oldFace;
				}
			})
			// throw new Error('wtf');
			if(justAsGood) {
				face.removeItselfFromEdges();
				return justAsGood;
			}
		}
		this.faces.push(face);
		return face;
	},
	destroyEdge: function(edge, ignoreFaces) {
		this.edges = this.edges.filter(function(e){
			return (e !== edge);
		});
		edge.removeItselfFromVertices();
		if(!ignoreFaces) {
			// if(edge.faces.length !== 2) throw new Error('wtf');
			// if(edge.faces.length > 1 && edge.faces[1]) this.destroyFace(edge.faces[1]);
			// if(edge.faces.length > 0 && edge.faces[0]) this.destroyFace(edge.faces[0]);
			for (var i = edge.faces.length - 1; i >= 0; i--) {
				if(edge.faces[i]) this.destroyFace(edge.faces[i]);
			};
		}
	},
	destroyFace: function(face) {
		this.faces = this.faces.filter(function(f){
			return (f !== face);
		});
		face.removeItselfFromEdges();
	},
	collectVertices: function() {
		return this.vertices;
	},
	collectFaces: function() {
		var faces = [];
		for (var i = this.faces.length - 1; i >= 0; i--) {
			var face3 = this.faces[i].getFace3(this.vertices);
			if(face3) {
				faces.push(face3);
				//convert vertices to vertex indices
				face3.a = this.vertices.indexOf(face3.a);
				face3.b = this.vertices.indexOf(face3.b);
				face3.c = this.vertices.indexOf(face3.c);
			}
		};
		return faces;
	},
	splitEdge: function(edge) {
		var faces = edge.faces;
		var newParts = edge.split();
		this.vertices.push(newParts.vertex);
		this.edges.push(newParts.edges[0]);
		this.edges.push(newParts.edges[1]);
		getNewEdgeConnectedTo = function(sharedEdge) {
			if(sharedEdge.isConnectedTo(newParts.edges[0])) return newParts.edges[0];
			if(sharedEdge.isConnectedTo(newParts.edges[1])) return newParts.edges[1];
		}
		var _this = this;
		faces.forEach(function(f){
			var splitEdge = new Edge(newParts.vertex, f.getVertexOpposingEdge(edge));
			_this.edges.push(splitEdge);
			var prevEdge = f.getPrevEdge(edge);
			var nextEdge = f.getNextEdge(edge);
			_this.createFace(splitEdge, getNewEdgeConnectedTo(prevEdge), prevEdge, f.flip);
			_this.createFace(splitEdge, nextEdge, getNewEdgeConnectedTo(nextEdge), f.flip);
		});
		this.destroyEdge(edge);
	},
	updateNormals: function() {
		this.faces.forEach(function(face) {
			face.computeNormal();
		})

		this.vertices.forEach(function(vertex) {
			vertex.computeNormal(areaWeighted);
		})
	},
	retriangulateEdge: function(edge) {
		return;
		if(edge.faces.length != 2) return;
		var v1 = edge.faces[0].getVertexOpposingEdge(edge);
		var v2 = edge.faces[1].getVertexOpposingEdge(edge);
		var f1v = edge.faces[0].getVerts();
		var f2v = edge.faces[1].getVerts();
		// console.log('f[' + edge.faces[0].id + ']vs:', f1v[0].id, f1v[1].id, f1v[2].id);
		// console.log('f[' + edge.faces[1].id + ']vs:', f2v[0].id, f2v[1].id, f2v[2].id);
		var prototypeEdge = this.createEdge(v1, v2);
		if(prototypeEdge.getLength() < edge.getLength()) {
			console.log('retriangulate', edge.id);
			var edgeA1 = edge.faces[0].getNextEdge(edge);
			var edgeA2 = edge.faces[1].getPrevEdge(edge);
			var f1 = this.createFace(prototypeEdge, edgeA1, edgeA2);

			var edgeB1 = edge.faces[1].getNextEdge(edge);
			var edgeB2 = edge.faces[0].getPrevEdge(edge);
			var f2 = this.createFace(prototypeEdge, edgeB1, edgeB2);
			// var f2 = this.createFace(prototypeEdge, edge.faces[0].getPrevEdge(edge), edge.faces[1].getNextEdge(edge));
			// console.log('A', prototypeEdge.v1.id, prototypeEdge.v2.id);
			// console.log('-', f1.edges[0].v1.id,f1.edges[0].v2.id);
			// console.log('-', f1.edges[1].v1.id,f1.edges[1].v2.id);
			// console.log('B', prototypeEdge.v1.id, prototypeEdge.v2.id);
			// console.log('-', f2.edges[0].v1.id,f2.edges[0].v2.id);
			// console.log('-', f2.edges[1].v1.id,f2.edges[1].v2.id);
			// this.faces[0].tradeEdgesWithFace(this.faces[1], this.faces[0].getNextEdge(this), this.faces[1].getNextEdge(this));
			// this.faces[0].reverseEdges();
			this.destroyEdge(edge);
			// this.faces[1].reverseEdges();
			// this.v1 = prototypeEdge.v1;
			// this.v2 = prototypeEdge.v2;
		} else {
			this.destroyEdge(prototypeEdge, true);
		}
	}
};

module.exports = GeometryGeneratorTetraHedron;