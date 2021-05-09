import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';


import {
  Noise
} from 'https://1florki.github.io/jsutils2/noise.js'


import {
  LPSphere,
  Helper
} from './lp.js'
import {
  Gradient
} from 'https://1florki.github.io/threejsutils/gradient.js'

const defaultStarColors = [new THREE.Color(0xff3322), new THREE.Color(0x22dd22), new THREE.Color(0xffcc22), new THREE.Color(0xaaaaaa), new THREE.Color(0xcc33ff), new THREE.Color(0x33ccff), new THREE.Color(0xbbffcc)];

const atmosFragmentShader = `
uniform vec3 downColor;
uniform vec3 upColor;

uniform float debugShader;

varying float sunAngle; // time of day
varying float normalAngle; // horizont
varying float normalSunAngle; 

void main() {
  vec3 color = mix(downColor, upColor,  clamp(normalSunAngle + 0.8, 0.0, 1.0) * (pow(clamp(0.8 + normalAngle, 0.0, 1.0), 3.0) + clamp(pow(normalSunAngle, 3.0), 0.0, 0.5)));
  vec4 atmoVec = vec4(color * (clamp(0.8 + normalAngle, 0.0, 1.0) * 0.5 + pow(normalSunAngle, 3.0) * 0.5), 1.0);

  vec4 debugVec = vec4(sunAngle / 2.0 + .5, normalAngle / 2.0 + .5, normalSunAngle / 2.0 + .5, 1.0);

  gl_FragColor = mix(atmoVec, debugVec, debugShader);
}
`;

const atmosVertexShader = `
uniform vec3 viewVector;

varying float sunAngle;
varying float normalAngle;
varying float normalSunAngle;

void main() 
{
  vec3 sun = vec3(0.0, 0.0, 1.0);
  sunAngle = dot(sun, viewVector);
  normalAngle = dot(normal, viewVector);
  normalSunAngle = dot(normal, sun);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const hemisphereColorsUp = [{stop: -0.9, color: new THREE.Color(0x101010)},
                          {stop: -0.5, color: new THREE.Color(0xccbb77)},
                          {stop: 0.0, color: new THREE.Color(0xccbb77)},
                          {stop: 0.6, color: new THREE.Color(0xccbb77)}];

const hemisphereColorsDown = [{stop: -0.9, color: new THREE.Color(0x050000)},
                          {stop: -0.5, color: new THREE.Color(0xaa2255)},
                          {stop: 0.0, color: new THREE.Color(0xaa8877)},
                          {stop: 0.6, color: new THREE.Color(0xaa8877)}];

const atmoColorUp = [{stop: -0.9, color: new THREE.Color(0x330044)},
                    {stop: -0.4, color: new THREE.Color(0x550011)},
                    {stop: -0.1, color: new THREE.Color(0xff9900)},
                    {stop: 0.1, color: new THREE.Color(0xff4400)}]

const atmoColorDown = [{stop: -0.4, color: new THREE.Color(0x000044)},
                    {stop: -0.3, color: new THREE.Color(0x330099)},
                    {stop: 0.0, color: new THREE.Color(0x550099)},
                    {stop: 0.2, color: new THREE.Color(0x0022bb)}]

// sky creates and updates stars, atmosphere and hemisphere lighting 
class Sky {
  constructor(opt) {
    opt = opt || {};
    this.starCount = opt.starCount || 1000;
    this.starSize = opt.starSize || 0.03;
    this.starMinDist = opt.starMinDist || 10;
    this.starMaxDist = opt.starMaxDist || 11;
    this.starColors = opt.starColors || defaultStarColors;
    
    this.atmoSubdivisions = opt.atmoSubdivisions || 5;
    this.atmoRadius = opt.atmoRadius || 10;
    
    this.sunLight = opt.sunLight;
    this.sunLightMaxIntensity = opt.sunLigthMaxIntensity || 0.8;
    
    this.atmo = this.createAtmosphere(this.atmoRadius, this.atmoSubdivisions);
    
    this.stars = this.createStars(this.starCount, this.starSize, this.starMinDist, this.starMaxDist, this.starColors);
    
    this.hemisphereLightColorsUp = Gradient.stops(hemisphereColorsUp);
    this.hemisphereLightColorsDown = Gradient.stops(hemisphereColorsDown);
    
    this.atmoColorsUp = Gradient.stops(atmoColorUp);
    this.atmoColorsDown = Gradient.stops(atmoColorDown);
    
    //this.hemisphereLight = new THREE.HemisphereLight(new THREE.Color("black"), new THREE.Color("black"), 0.8);
  }
  
  createAtmosphere(r, subs) {
    var ico = new LPSphere({subs: subs, radius: r});
	var sphereGeom = ico.geo();
    
	var customMaterial = new THREE.ShaderMaterial( 
	{
	    uniforms: 
		{ 
			downColor: { value: new THREE.Color(0x5555ff) },
			upColor: { value: new THREE.Color(0xff4422) },
			viewVector: { value: new THREE.Vector3() },
            debugShader: { value: 0 }
		},
		vertexShader: atmosVertexShader,
		fragmentShader: atmosFragmentShader,
		side: THREE.BackSide,
        depthWrite: false,
        flatShading: false
	});
    var mesh = new THREE.Mesh(sphereGeom, customMaterial);
	return mesh;
  }
  
  createStars(num, size, minDist, maxDist, colors) {
    var white = new THREE.Color("white");
    var stars = [];
    var starGeo = new THREE.Geometry();
    var starPos;
    
    for(let i = 0; i < num; i++) {
      starPos = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      
      starPos.setLength(Math.random() * (maxDist - minDist) + minDist);
      starGeo.vertices.push(starPos);
      var colorI = Math.floor(Math.random() * colors.length);
      starGeo.colors.push(colors[colorI].clone().lerp(white, Math.random() + 0.5));
    }
    var starMaterial = new THREE.PointsMaterial({vertexColors: true, size: size, depthWrite: false, transparent: true, fog: false});
    var mesh = new THREE.Points(starGeo, starMaterial);
    return mesh;
  }
  
  updateSky(cameraPosition, time) {
    let daytime = cameraPosition.x;
    //console.log(daytime)
    
    this.atmo.material.uniforms.viewVector.value.copy(cameraPosition);
    //this.hemisphereLight.color = this.hemisphereLightColorsUp.colorAtPos(daytime);
    //this.hemisphereLight.groundColor = this.hemisphereLightColorsDown.colorAtPos(daytime);
    
    this.atmo.material.uniforms.upColor.value.copy(this.atmoColorsUp.get(daytime));
    this.atmo.material.uniforms.downColor.value.copy(this.atmoColorsDown.get(daytime));
    
    this.stars.material.opacity = Math.max(Math.min(1.0 - (daytime + 0.4) * 2, 1), 0);
    
    if(daytime < -0.5) {
      let sunIntensity = Math.max(daytime + 1.0, 0) * 2;
      if(this.sunLight) this.sunLight.intensity = this.sunLightMaxIntensity * sunIntensity;
    } else {
      if(this.sunLight) this.sunLight.intensity = this.sunLightMaxIntensity;
    }
  }
}

class Sun {
  constructor(opts) {
    opts = opts || {};
    let dir = opts.dir || new THREE.Vector3(1, 0, 0);
    let dist = opts.dist || 5;
    
    this.color = opts.color || 0xffcc99;
    this.intensity = opts.intensity || 1.5;
        
    this.light = new THREE.DirectionalLight(this.color, this.intensity);
    this.light.position.copy(dir);
    
    this.gradient = new Gradient(opts.gradient || {between: [Gradient.color(0x881122), Gradient.color(0xccaa00)]});
    
    let sphere = new LPSphere({
      subs: 1,
      noise: new Noise(opts.noise || {
        scale: 1,
        min: 0.8
      }),
      gradient: this.gradient
    })
    /*
    sphere.changeColors((r, g, b, x, y, z) => {
      let n = (y + 1) / 2;
      return {r: Math.min(r + n, 1), g: g, b: b};
    });*/
    
    this.sun = sphere.mesh();
     opts.scl = opts.scl || 1
    this.sun.scale.set(opts.scl, opts.scl, opts.scl)
    
    this.sun.material.emissive = Gradient.color(opts.emissive || 0xff6600);
    this.sun.material.emissiveIntensity = opts.emissiveIntensity || 0.5;
    this.sun.material.fog = false;
    
    this.sun.position.copy(dir);
    this.sun.position.setLength(dist);
  }

}
export { Sky, Sun };