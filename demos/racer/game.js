import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';
import {
  EffectComposer
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/postprocessing/EffectComposer.js';
import {
  RenderPass
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/postprocessing/RenderPass.js';
import {
  BokehPass
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/postprocessing/BokehPass.js';

import {
  GLTFHelper
} from 'https://1florki.github.io/threejsutils/gltf.js';
import {
  StereoEffect
} from 'https://1florki.github.io/threejsutils/stereo.js'
import {
  Gradient
} from 'https://1florki.github.io/threejsutils/gradient.js'
import {
  ShadowVolumeMesh
} from 'https://1florki.github.io/threejsutils/shadow.js'

import {
  TextGenerator
} from 'https://1florki.github.io/threejsutils/text.js'


import {
  Noise
} from 'https://1florki.github.io/jsutils2/noise.js'
import {
  DeviceOrientationControls
} from './DeviceOrientationControls.js';

import {
  LPSphere,
  LPCylinder,
  Helper
} from './../../0_1/lp.js'

import {
  Planet
} from './../../0_1/planet.js'

import {
  Sky,
  Sun
} from './../../0_1/atmo.js'

var renderer, scene, clock, stereoEffect, lights = {}, keys = {}, controls;

var gltf, planet, sun, sky;

var car, cam, camNode;

// settings
var settings = {
  stereo: false
}

var acc = 0,
  steering = 0;

var roadNoise;

var didOrientationRequest;
var orientation;

function setupScene() {
  renderer = new THREE.WebGLRenderer();
  clock = new THREE.Clock();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  //renderer.physicallyCorrectLights = true;

  let d = renderer.domElement;
  d.style.position = 'absolute';
  d.style.left = '0px';
  d.style.top = '0px';

  scene = new THREE.Scene();

  let ratio = window.innerWidth / window.innerHeight * (settings.stereo ? 2 : 1);

  cam = new THREE.PerspectiveCamera(60, ratio, 0.02, 13);

  if (settings.stereo) controls = new DeviceOrientationControls(cam);

  // touch events for mobile
  
  let el = renderer.domElement;
  el.addEventListener("touchstart", handleTouch, true);
  el.addEventListener("touchend", handleTouch, true);
  el.addEventListener("touchcancel", handleTouch, true);
  el.addEventListener("touchmove", handleTouch, true);

  // keyboard events for non-mobile
  document.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true
  }, false);

  document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false
  }, false);

  document.addEventListener("mouseup", () => {
    requestOrientation();
  })
  
  // window resize
  window.addEventListener("resize", onWindowResize, false);

  // lights
  lights.ambi = new THREE.AmbientLight(0xff8888, 0.10); // soft white light
  scene.add(lights.ambi);

  let light = new THREE.HemisphereLight(0xff8888, 0xff0000, 0.10);
  scene.add(light);

  // create sun (also creates directional light)
  sun = new Sun({
    dir: new THREE.Vector3(0, -0.05, 1),
    intensity: 1.8,
    color: 0xff7722,
    scl: 0.7,
    emissiveIntensity: 0.8
  });

  scene.add(sun.sun);
  scene.add(sun.light);

  if (settings.stereo) {
    stereoEffect = new StereoEffect(renderer);
    stereoEffect.aspect = window.innerWidth / window.innerHeight
    stereoEffect.setEyeSeparation(0.003)
    stereoEffect.setSize(window.innerWidth, window.innerHeight);
  }

  // create road
  // y offset for road at (x, 0, z)
  // road goes horizontally around planet
  roadNoise = new Noise({
    min: -0.13,
    max: 0.13,
    oct: 3,
    per: 0.3,
    scl: 2.8
  })

  // create planet

  // noise for offroad
  let noise = new Noise({
    octaves: 3,
    min: -0.03,
    max: 0.15,
    scale: 5,
    pow: 1.5,
    persistence: 0.5
  });

  // custom heightfield for planet 
  // thats flat where the road is
  let heightfield = {
    getNormalized: (x, y, z) => {
      let a = Math.abs(y - roadNoise.get(x, 0, z));
      let min = 0.1,
        max = 0.4;
      let b = Math.max(Math.min((a - min) / (max - min), 1), 0.5);

      return b * noise.getNormalized(x, y, z) + 1;
    },
    get: (x, y, z) => {
      let a = Math.abs(y - roadNoise.get(x, 0, z));
      let min = 0.1,
        max = 0.4;
      let b = Math.max(Math.min((a - min) / (max - min), 1), 0.02);

      return b * noise.get(x, y, z) + 0.72;
    },
    getColor: (x, y, z) => {
      return heightfield.getNormalized(x, y, z);
    }
  }

  planet = new Planet({
    preset: "desert",
    light: sun.light,
    seed: 130,
    water: {
      enabled: false,
      height: 0.715
    },
    vegetation: {
      itemCount: 10,
      scale: 0.02,
      // only place vegetation ofroad but also close to the road
      positionCondition: (item, pos, height, color) => {
        let a = Math.abs(pos.y - roadNoise.get(pos.x, 0, pos.z));
        return (a > 0.1 && a < 0.4 && height > 0.717)
      }
    },
    subs: 6,
    heightfield: heightfield,
  });

  planet.makeClouds(20);
  scene.add(planet.mesh);

  let road = new LPCylinder({
    subs: 1,
    caps: false,
    sides: 100,
    height: 0.08,
    radius: 1
  });
  let roadColor = new THREE.Color(0x333333);
  road.setFaceColor(() => {
    return roadColor
  });
  let deformFunc = (x, y, z) => {
    let a = roadNoise.get(x, 0, z);
    return [0, a, 0];
  }
  road.transformVertices(deformFunc);
  road.setMag((a) => {
    return heightfield.get(a[0], a[1], a[2]) + 0.0008
  });
  planet.mesh.add(road.mesh());

  // load and add car
  gltf = new GLTFHelper({
    car: "car.glb"
  }, () => {
    car = gltf.models.car;
    gltf.changeMaterials("car", (a) => {
      a.metalness = 0.3
      a.roughness = 0.6;
      if (a.name == "TailLights") {
        car.tail = a;
        a.emissiveIntensity = 0.0;
        a.emissive = new THREE.Color("red")
      }
      return a;
    })

    let scl = 0.007;
    car.scale.set(scl, scl, scl);

    // add car to planet (in container node so we can still rotate car)
    let container = planet.addContainerObjectToPlanet(car, new THREE.Vector3(1, 0, 0), -0.0002);

    // add cam behind car
    if (window.innerWidth < window.innerHeight) {
      // if portrait mode move cam further away
      cam.position.set(0, 0.05, -0.09);
    } else {
      cam.position.set(0, 0.03, -0.05);
    }
    cam.rotation.y = Math.PI;
    cam.rotation.x = 0.2;
    container.add(cam);

    // add car headlamps
    // targets for headlamps
    let target = new THREE.Object3D();
    target.position.set(1, 0, 5);
    car.add(target);

    let target2 = new THREE.Object3D();
    target2.position.set(-1, 0, 5);
    car.add(target2);

    // spotlights
    const spotLight = new THREE.SpotLight(0xff9977, 1, 0.5, 0.3, 0.1, 5);
    spotLight.position.set(0.005, 0.005, 0.012);
    spotLight.target = target;
    container.add(spotLight);

    const spotLight2 = new THREE.SpotLight(0xff9977, 1, 0.5, 0.3, 0.1, 5);
    spotLight2.position.set(-0.005, 0.005, 0.012);
    spotLight2.target = target2;
    container.add(spotLight2);
  });

  sky = new Sky();
  scene.add(sky.stars);
  scene.add(sky.atmo);

  // stay at same time of day
  sky.updateSky(new THREE.Vector3(0, -1, 0), 0);
}

function requestOrientation() {
  if (didOrientationRequest) return;
  didOrientationRequest = true;
  console.log("requesting orientation");
  if (typeof (DeviceMotionEvent) !== 'undefined' && typeof (DeviceMotionEvent.requestPermission) === 'function') {
    DeviceMotionEvent.requestPermission().then(response => {
      if (response === 'granted') {
        window.addEventListener("deviceorientation", handleOrientation, false);
      } else {
        console.log("devicemotion permission not granted");
      }
    }).catch(console.error);
  } else {
    window.addEventListener("deviceorientation", handleOrientation, false);
  }
}

function handleOrientation(event) {
  if (window.innerWidth < window.innerHeight) {
    orientation = -event.gamma * 0.8;
  } else {
    orientation = -event.beta;
  }
}

function handleTouch(evt) {
  requestOrientation();
  //evt.preventDefault();

  keys["w"] = false;
  keys["s"] = false;

  for (let t of evt.targetTouches) {
    let x = (t.clientX / window.innerWidth) * 2 - 1;
    let y = -(t.clientY / window.innerHeight) * 2 + 1;
    if (x > 0) {
      keys["w"] = true;
    } else {
      keys["s"] = true;
    }
  }
}

function onWindowResize() {
  cam.aspect = window.innerWidth / window.innerHeight * (settings.stereo ? 2 : 1);
  cam.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  if (settings.stereo) stereoEffect.setSize(window.innerWidth, window.innerHeight);
  
  if (window.innerWidth < window.innerHeight) {
    // if portrait mode move cam further away
    cam.position.set(0, 0.05, -0.09);
  } else {
    cam.position.set(0, 0.03, -0.05);
  }
}

function render() {
  if (settings.stereo) {
    stereoEffect.render(scene, cam);
  } else {
    renderer.render(scene, cam);
  }
}

function clamp(a, min, max) {
  return Math.max(Math.min(a, max), min);
}

function animate(now) {
  requestAnimationFrame(animate);
  let delta = clock.getDelta();
  let total = clock.getElapsedTime();
  if (car) {
    let speed = 0.0025;

    let move = new THREE.Vector3(0, 0, 0);

    var gamepads = navigator.getGamepads();
    if (gamepads.length > 0 && gamepads[0] != undefined) {
      let p = gamepads[0];
      let accButton = p.buttons[7].value;
      let brakeButton = p.buttons[6].value;
      acc += delta * speed * (accButton - brakeButton);
      //console.log(p);
      if (brakeButton > 0.3) {
        car.tail.emissiveIntensity = 0.5;
      } else {
        car.tail.emissiveIntensity = 0;
      }

      steering -= p.axes[0] * delta * 0.5;
    } else {
      if (keys["w"]) {
        acc += delta * speed;
      }
      if (keys["s"]) {
        acc -= delta * speed;
        car.tail.emissiveIntensity = 0.5;
      } else {
        car.tail.emissiveIntensity = 0.0;
      }
    }
    let x = car.parent.position.x,
      z = car.parent.position.z;
    let l = Math.sqrt(x * x + z * z);
    let n = roadNoise.get(x / l, 0, z / l);
    let a = (car.parent.position.y - n);

    // car on road
    if (Math.abs(a) < 0.04) {
      acc *= 0.98;
    } else {
      // outside road
      acc *= 0.96;
    }

    move.z += acc;

    if (orientation != undefined && (gamepads.length < 1 || gamepads[0] != undefined)) {
      steering = ((orientation + steering * 20) / 21) * 0.08;
    } else {
      if (keys["a"]) {
        steering += delta * speed * 200;
      }
      if (keys["d"]) {
        steering -= delta * speed * 200;
      }
      steering *= 0.97;
    }

    let maxSteer = 0.35;
    steering = clamp(steering, -maxSteer, maxSteer);

    car.parent.yaw += steering * acc * 50;
    car.rotation.y = steering * 0.5

    let maxDist = 0.1
    planet.moveObjectLocal(car.parent, move, true, (pos) => {
      pos.y = Math.min(Math.max(n - maxDist, pos.y), n + maxDist);
    });
  }

  planet.animate(total);

  if(controls) controls.update();
  
  render();
}

setupScene();
animate();
