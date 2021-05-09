import {
  Gradient
} from 'https://1florki.github.io/threejsutils/gradient.js'

import {
  MeshStandardMaterial,
  Mesh,
  BufferGeometry,
  BufferAttribute
} from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js';


// HELPER

export class Helper {
  static getArrayVertexLength(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  }

  static getArrayVertexMidpoint(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  }
  static addTriangleToArray(toArr, triangle) {
    for(let vertex of triangle) {
      for(let coord of vertex) toArr.push(coord);
    }
  }
  static normalizeArrayVertex(a) {
    let l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    if(l == 0) return; 
    a[0] /= l;
    a[1] /= l;
    a[2] /= l;
  }
  static createPerFaceVerticesFromIndices(ver, ind) {
    let vertices = [];
    for(let i = 0; i < ind.length; i++) {
      let vi = ind[i] * 3;
      vertices.push(ver[vi], ver[vi + 1], ver[vi + 2]);
    }
    return vertices;
  }
  
  static subdivideTriangle(a, b, c, vertexFunction) {
    let newTriangles = [];
    // get midpoint between points of triangle
    let d = Helper.getArrayVertexMidpoint(a, b);
    let e = Helper.getArrayVertexMidpoint(b, c);
    let f = Helper.getArrayVertexMidpoint(c, a);
    if(vertexFunction) {
      vertexFunction(d);
      vertexFunction(e);
      vertexFunction(f);
    }
    // add four new triangles using midpoints and orignal points
    Helper.addTriangleToArray(newTriangles, [a,d,f]);
    Helper.addTriangleToArray(newTriangles, [d,b,e]);
    Helper.addTriangleToArray(newTriangles, [e,c,f]);
    Helper.addTriangleToArray(newTriangles, [d,e,f]);
    return newTriangles;
  }
  
  static addArrayToArray(toArr, fromArr) {
    for(let i of fromArr) {
      toArr.push(i);
    }
  }
  
  static vertexPosForAngle(a, h) {
    return [Math.sin(a), h, Math.cos(a)];
  }
  
  static addMorphToGeo(geo, morphGeo) {
    if(geo.morphAttributes.position == undefined) geo.morphAttributes.position = [];
    if(geo.morphAttributes.normal == undefined) geo.morphAttributes.normal = [];
    
    let i = geo.morphAttributes.position.length;
    geo.morphAttributes.position[i] = morphGeo.getAttribute("position").clone();
    geo.morphAttributes.normal[i] = morphGeo.getAttribute("normal").clone();
  }
}


// BASE GEOMETRY CLASS


export class LPGeometry {
  constructor(opts) {
    opts = opts || {};

    this.computeNormals = opts.computeNormals != undefined ? opts.computeNormals : true;
    this.subs = opts.subs || 0;
    
    this.verts = undefined;
    this.colors = undefined;
    this.uvs = undefined;
  }

  deform(deformFunction) {
    this.transformVertices(deformFunction);
  }
  color(colorFunc) {
    this.setFaceColor(colorFunc);
  }
  setMag(magFunc) {
    this.setVerticesLength(magFunc)
  }

  transform(transformVertex) {
    this.transformVertices(() => transformVertex);
  }

  scale(scaleVertex) {
    this.scaleVertices(() => scaleVertex);
  }
  setMagAll(mag) {
    this.setVerticesLength(() => mag)
  }

  applyGradient(heightfield, gradient) {
    if (!gradient) return

    this.setFaceColorFrom(heightfield, gradient);
  }
  
  apply(heightfield, gradient) {
    this.applyGradient(heightfield, gradient);
    this.multiplyVerticesBy(heightfield)
  }
  
  merge(otherGeo) {
    for(let i = 0; i < otherGeo.verts.length; i++) {
      this.verts.push(otherGeo.verts[i]);
      
      if(this.colors && otherGeo.colors) this.colors.push(otherGeo.colors[i]);
      if(this.uvs && otherGeo.uvs) this.uvs.push(otherGeo.uvs[i]);
    }
  }

  checkVertices() {
    if (this.verts == undefined) this.createVertices();
  }
  createVertices() {
    this.verts = [];
    this.updatedVerticesCount = true;
  }

  subdivideAll(nums) {
    if (nums == 0) return this.subs;
    nums = nums || 1;

    let newVert = [],
      oldVerts = this.verts;
    // go through each triangle 
    // (each containing 3 points with x, y and z)
    for (let j = 0; j < oldVerts.length; j += 9) {
      // split every triangle into four smaller triangles

      // get current triangle
      let a = [oldVerts[j], oldVerts[j + 1], oldVerts[j + 2]];
      let b = [oldVerts[j + 3], oldVerts[j + 4], oldVerts[j + 5]];
      let c = [oldVerts[j + 6], oldVerts[j + 7], oldVerts[j + 8]];

      let subTriangles = Helper.subdivideTriangle(a, b, c);
      Helper.addArrayToArray(newVert, subTriangles);
    }
    this.verts = newVert;
    this.subs += 1;

    this.updatedVerticesCount = true;

    return this.subdivideAll(nums - 1);
  }

  removeFaces(removeFunction) {
    this.checkVertices();

    let vert = this.verts;
    let newTarget = [];
    for (let i = 0; i < vert.length; i += 9) {
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      let b = [vert[i + 3], vert[i + 4], vert[i + 5]];
      let c = [vert[i + 6], vert[i + 7], vert[i + 8]];
      if (!removeFunction(a, b, c)) {
        for (let j = 0; j < 9; j++) {
          newTarget.push(vert[i + j]);
        }
      }
    }
    this.updatedVerticesCount = true;
    this.verts = newTarget;
  }

  // modify vertices
  setVertices(setFunction) {
    this.checkVertices();
    var vert = this.verts;

    for (let i = 0; i < vert.length; i += 3) {
      let newSet = setFunction(vert[i], vert[i + 1], vert[i + 2]);
      if (newSet) {
        vert[i] = newSet[0];
        vert[i + 1] = newSet[1];
        vert[i + 2] = newSet[2];
      }
    }
    this.verts = vert;
  }

  // deform function should return an array with three elements, being the movement vector of that vertex
  transformVertices(transformFunction) {
    this.checkVertices();
    var vert = this.verts;

    for (let i = 0; i < vert.length; i += 3) {
      let transform = transformFunction(vert[i], vert[i + 1], vert[i + 2]);
      if (transform) {
        vert[i] += transform[0];
        vert[i + 1] += transform[1];
        vert[i + 2] += transform[2];
      }
    }
    this.verts = vert;
  }

  scaleVertices(scaleFunction) {
    this.checkVertices();
    var vert = this.verts;

    for (let i = 0; i < vert.length; i += 3) {
      let scale = scaleFunction(vert[i], vert[i + 1], vert[i + 2]);
      if (scale) {
        vert[i] *= scale[0];
        vert[i + 1] *= scale[1];
        vert[i + 2] *= scale[2];
      }
    }
    this.verts = vert;
  }

  setVerticesLength(lengthFunction) {
    this.checkVertices();
    var vert = this.verts;

    for (let i = 0; i < vert.length; i += 3) {
      // get current triangle
      let a = [vert[i], vert[i + 1], vert[i + 2]];
      let l = lengthFunction(a) / Helper.getArrayVertexLength(a);
      vert[i] *= l;
      vert[i + 1] *= l;
      vert[i + 2] *= l;
    }
    this.verts = vert;
  }

  multiplyVertices(multiplyFunction) {
    this.checkVertices();
    var vert = this.verts;

    for (let i = 0; i < vert.length; i += 3) {
      let l = multiplyFunction(vert[i], vert[i + 1], vert[i + 2]);
      vert[i] *= l;
      vert[i + 1] *= l;
      vert[i + 2] *= l;
    }
    this.verts = vert;
  }

  
  changeColors(colorFunction) {
    this.checkVertices();
    let colors = this.colors, newColors = [], vert = this.verts;
    for (let i = 0; i < vert.length; i += 3) {
      let color = colorFunction(colors[i], colors[i + 1], colors[i + 2], vert[i], vert[i + 1], vert[i + 2]);
      newColors.push(color.r, color.g, color.b);
      //colors.push(color.r, color.g, color.b);
    }
    this.colors = newColors;
  }
  
  setVertexColor(colorFunction) {
    this.checkVertices();
    let colors = [],
      vert = this.verts;
    for (let i = 0; i < vert.length; i += 3) {
      let color = colorFunction(vert[i], vert[i + 1], vert[i + 2]);
      colors.push(color.r, color.g, color.b);
    }
    this.colors = colors;
  }

  // add color of average of triangles
  setFaceColor(colorFunction) {
    this.checkVertices();
    let colors = [],
      vert = this.verts;
    for (let i = 0; i < vert.length; i += 9) {
      let x = (vert[i] + vert[i + 3] + vert[i + 6]) / 3;
      let y = (vert[i + 1] + vert[i + 4] + vert[i + 7]) / 3;
      let z = (vert[i + 2] + vert[i + 5] + vert[i + 8]) / 3;
      let color = colorFunction(x, y, z);
      for (let j = 0; j < 3; j++) {
        colors.push(color.r);
        colors.push(color.g);
        colors.push(color.b);
      }
    }
    this.colors = colors;
  }


  setUV(uvFunction) {
    this.checkVertices();
    let uvs = [],
      vert = this.verts;
    for (let i = 0; i < vert.length; i += 3) {
      let uv = uvFunction(vert[i], vert[i + 1], vert[i + 2], Math.floor(i / 3) % 3);
      uvs.push(uv[0], uv[1]);
    }
    this.uvs = uvs;
  }

  multiplyVerticesBy(heightfield) {
    let lengthFunction = (x, y, z) => {
      return heightfield.get(x, y, z);
    };
    this.multiplyVertices(lengthFunction);
  }
  setVerticesLengthFrom(heightfield) {
    let lengthFunction = (x, y, z) => {
      return heightfield.get(x, y, z);
    };
    this.setVerticesLength(lengthFunction);
  }
  setVertexColorFrom(heightfield, gradient) {
    let colorFunction = (x, y, z) => {
      return gradient.get(heightfield.getColor(x, y, z))
    };
    this.setVertexColor(colorFunction);
  }

  setFaceColorFrom(heightfield, gradient) {
    let colorFunction = (x, y, z) => {
      return gradient.get(heightfield.getColor(x, y, z))
    };
    this.setFaceColor(colorFunction);
  }

  createGeometry() {
    this.checkVertices();

    var bufferedVertices = new Float32Array(this.verts.length);
    if (this.colors) var bufferedColor = new Float32Array(this.colors.length);
    if (this.uvs) var bufferedUVs = new Float32Array(this.uvs.length);

    for (let i = 0; i < this.verts.length; i++) {
      bufferedVertices[i] = this.verts[i];
    }
    for (let i = 0; this.colors && i < this.colors.length; i++) {
      bufferedColor[i] = this.colors[i];
    }
    for (let i = 0; this.uvs && i < this.uvs.length; i++) {
      bufferedUVs[i] = this.uvs[i];
    }

    var geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(bufferedVertices, 3));

    if (this.colors) geo.setAttribute('color', new BufferAttribute(bufferedColor, 3));
    if (this.uvs) geo.setAttribute('uv', new BufferAttribute(bufferedUVs, 2));

    if (this.computeNormals == true) geo.computeVertexNormals();

    return geo;
  }
  geo() {
    return this.createGeometry()
  }
  mesh(geo) {
    geo = geo || this.geo();
    let mat = new MeshStandardMaterial({
      vertexColors: (this.colors != undefined),
      metalness: 0.0,
      roughness: 1.0,
      flatShading: true
    })
    return new Mesh(geo, mat);
  }
}



// SHAPES



const icosahedronInd = [5, 0, 11, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
const t = (1.0 + Math.sqrt(5)) / 2.0;
const icosahedronVer = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1];

const boxVer = [-1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, -1, -1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, -1, ];

/*
*
*
*  LPIcosahedron
*
*
*/

export class LPIcosahedron extends LPGeometry {
  constructor(opts) {
    opts = opts || {};
    super(opts);

    this.radius = opts.radius || 1;

    this.createVertices();
    this.setMagAll(this.radius);
    this.subdivideAll(this.subs);

    if (opts.noise != undefined) {
      this.apply(opts.noise, opts.gradient);
    }
  }
  createVertices() {
    this.verts = Helper.createPerFaceVerticesFromIndices(icosahedronVer, icosahedronInd);
  }
}

/*
 *
 *  LPSphere
 *
 */

export class LPSphere extends LPIcosahedron {
  constructor(opts) {
    opts = opts || {};
    super(opts);

    this.setMagAll(this.radius);
    if (opts.noise != undefined) {
      this.apply(opts.noise, opts.gradient);
    }
  }
}

/*
 *
 *  LPPlane
 *
 */

export class LPPlane extends LPGeometry {
  constructor(opts) {
    opts = opts || {};
    super(opts);
    this.w = opts.w || 1;
    this.l = opts.l || 1;
    this.h = opts.h || 0

    this.numW = opts.numW || 1;
    this.numL = opts.numL || 1;

    if (opts.cellSize) {
      this.numW = Math.round(this.w / opts.cellSize);
      this.numL = Math.round(this.l / opts.cellSize);
    }

    this.createVertices();
    this.subdivideAll(this.subs)
    if (opts.noise != undefined) {
      this.apply(opts.noise, opts.gradient);
    }
  }

  createVertices() {
    this.verts = [];
    let cellW = this.w / this.numW;
    let cellL = this.l / this.numL;
    for (let x = 0; x < this.numW; x++) {
      for (let z = 0; z < this.numL; z++) {
        let xpos = x * cellW - this.w / 2;
        let zpos = z * cellL - this.l / 2;

        let cell = [xpos + cellW, this.h, zpos,
         xpos, this.h, zpos,
         xpos + cellW, this.h, zpos + cellL,

         xpos, this.h, zpos + cellL,
         xpos + cellW, this.h, zpos + cellL,
         xpos, this.h, zpos, ];
        Helper.addArrayToArray(this.verts, cell);
      }
    }
  }
  apply(heightField, gradient) {
    this.applyGradient(heightField, gradient);

    let deformFunc = (x, y, z) => {
      return [0, heightField.get(x, 0, z), 0];
    }
    this.transformVertices(deformFunc);
  }
}


/*
 *
 *  LPBox
 *
 */

export class LPBox extends LPGeometry {
  constructor(opts) {
    opts = opts || {};
    super(opts);
    this.createVertices();
    this.subdivideAll(this.subs);
    if (opts.noise != undefined) {
      this.apply(opts.noise, opts.gradient);
    }
  }
  createVertices() {
    this.verts = [];
    for (let v of boxVer) this.verts.push(v);
  }
}


/*
 *
 *  LPTriangle
 *
 */

export class LPTriangle extends LPGeometry {
  constructor(opts) {
    opts = opts || {};
    super(opts);
    this.createVertices();
    this.subdivideAll(this.subs);
    if (opts.noise != undefined) {
      this.apply(opts.noise, opts.gradient);
    }
  }
  createVertices() {
    this.verts = [];
    let v1 = Helper.vertexPosForAngle(0, 0);
    let v2 = Helper.vertexPosForAngle(Math.PI * 2 / 3, 0)
    let v3 = Helper.vertexPosForAngle(Math.PI * 4 / 3, 0);
    Helper.addTriangleToArray(this.verts, [v1, v2, v3]);
  }

  apply(heightField, gradient) {
    this.applyGradient(heightField, gradient);

    let deformFunc = (x, y, z) => {
      return [0, heightField.get(x, 0, z), 0];
    }
    this.transformVertices(deformFunc);
  }
}


/*
 *
 *  LPCylinder
 *
 */

export class LPCylinder extends LPGeometry {
  constructor(opt) {
    opt = opt || {};
    super(opt);

    this.sides = opt.sides != undefined && opt.sides > 2 ? opt.sides : 3;
    this.rows = opt.rows || 1;
    this.height = opt.height || 1;
    this.showCaps = opt.caps != undefined ? opt.caps : true;
    this.radius = opt.radius || 1;
    this.createVertices();

    this.subdivideAll(this.subs);

    let n = this.radius;
    let deformFunc = (x, y, z) => {
      return [n * x - x, 0, n * z - z];
    }
    this.transformVertices(deformFunc);

    if (opt.noise != undefined) {
      this.apply(opt.noise, opt.gradient);
    }
  }
  createVertices() {
    if (this.sides == undefined) return;
    let vertices = [],
      sides = this.sides,
      height = this.height;
    for (let i = 0; i < sides; i++) {
      if (this.showCaps) {
        let ta1 = i / sides * Math.PI * 2 + 0.0001;
        let ta2 = (i + 1) / sides * Math.PI * 2 + 0.0001;
        let tlo = -height / 2,
          thi = height / 2;
        let tv1 = Helper.vertexPosForAngle(ta1, tlo);
        let tv2 = Helper.vertexPosForAngle(ta2, tlo);
        let tv3 = [0, tlo, 0];

        let tv4 = Helper.vertexPosForAngle(ta1, thi);
        let tv5 = Helper.vertexPosForAngle(ta2, thi);
        let tv6 = [0, thi, 0];
        Helper.addTriangleToArray(vertices, [tv2, tv1, tv3]);
        Helper.addTriangleToArray(vertices, [tv5, tv6, tv4]);
      }
      for (let r = 0; r < this.rows; r++) {
        let lo = -height / 2 + r / this.rows * height,
          hi = -height / 2 + (r + 1) / this.rows * height;
        let a1 = i / sides * Math.PI * 2 + 0.0001;
        let a2 = (i + 1) / sides * Math.PI * 2 + 0.0001;
        let v1 = Helper.vertexPosForAngle(a1, lo);
        let v2 = Helper.vertexPosForAngle(a2, lo);
        let v3 = Helper.vertexPosForAngle(a1, hi)
        let v4 = Helper.vertexPosForAngle(a2, hi);
        Helper.addTriangleToArray(vertices, [v3, v2, v4]);
        Helper.addTriangleToArray(vertices, [v1, v2, v3]);
      }

    }
    this.verts = vertices;
  }

  apply(heightField, gradient) {
    this.applyGradient(heightField, gradient);

    let deformFunc = (x, y, z) => {
      let n = heightField.get(x, y, z);
      return [n * x - x, 0, n * z - z];
    }
    this.transformVertices(deformFunc);
  }
}

/*
 *
 *  LPPyramid
 *
 */

export class LPPyramid extends LPGeometry {
  constructor(opt) {
    opt = opt || {};
    super(opt);

    this.height = opt.height || 1.0;
    this.sides = opt.sides != undefined && opt.sides > 2 ? opt.sides : 3;
    this.base = opt.base != undefined ? opt.base : true;
    this.createVertices();

    this.subdivideAll(this.subs);
    if (opt.noise != undefined) {
      this.apply(opt.noise, opt.gradient);
    }
  }

  createVertices() {
    if (this.sides == undefined) return;

    let vertices = [],
      lo = 0,
      hi = this.height,
      sides = this.sides;
    for (let i = 0; i < sides; i++) {
      let a1 = i / sides * Math.PI * 2 + 0.0001;
      let a2 = (i + 1) / sides * Math.PI * 2 + 0.0001;
      let v1 = Helper.vertexPosForAngle(a1, lo);
      let v2 = Helper.vertexPosForAngle(a2, lo);
      let v3 = [0, hi, 0];
      Helper.addTriangleToArray(vertices, [v2, v3, v1]);
    }
    this.verts = vertices;
    if (this.base) this.addPyramidBase(this.sides);
  }

  addPyramidBase(sides) {
    let lo = 0;
    for (let i = 0; i < sides; i++) {
      let a1 = i / sides * Math.PI * 2 + 0.0001;
      let a2 = (i + 1) / sides * Math.PI * 2 + 0.0001;
      let v1 = Helper.vertexPosForAngle(a1, lo);
      let v2 = Helper.vertexPosForAngle(a2, lo);
      let v3 = [0, lo, 0];

      Helper.addTriangleToArray(this.verts, [v2, v1, v3]);
    }
  }
}
