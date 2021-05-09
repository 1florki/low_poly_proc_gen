import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

import {
  GLTFHelper
} from 'https://1florki.github.io/threejsutils/gltf.js';

import {
  Gradient
} from 'https://1florki.github.io/threejsutils/gradient.js'

import {
  Noise
} from 'https://1florki.github.io/jsutils2/noise.js'

import {
  ShadowVolumeMesh
} from 'https://1florki.github.io/threejsutils/shadow.js'

import {
  LPSphere,
  Helper
} from './lp.js'

const pitchAxis = new THREE.Vector3(0, 1, 0);
const yawAxis = new THREE.Vector3(1, 0, 0);

const defaultOptionsIslands = {
  subs: 5,
  radius: 1,
  shadow: true,
  noiseSettings: {
    octaves: 5,
    min: 0.7,
    max: 1.0,
    scale: 1,
    pow: 1.8,
    persistence: 0.5
  },
  material: {
    metalness: 0.0,
    roughness: 0.9
  },
  gradientSettings: {
    stops: [
      Gradient.colorStop(0.0, 0x000000),
      Gradient.colorStop(0.3, 0x996600),
      Gradient.colorStop(0.5, 0xccaa00),
      Gradient.colorStop(0.6, 0x669900)
    ]
  },

  water: {
    enabled: true,
    height: 0.8,
    noiseSettings: {
      min: 0.99,
      max: 1.01,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    },
    gradientSettings: {
      between: [Gradient.color(0x000022), Gradient.color(0x4477ff)]
    },
    morph: true,
    morphNoise: {
      min: 0.99,
      max: 1.01,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    }
  },

  vegetation: {
    enabled: true,
    folder: "https://1florki.github.io/low_poly_proc_gen/0_1/vegetation/",
    models: ["commontree1.glb", "commontree2.glb", "commontree3.glb", "plant1.glb", "plant2.glb", "plant3.glb", "palm1.glb", "palm2.glb", "palm3.glb", "palm4.glb", "grass1.glb", "grass2.glb", "grass3.glb", "bush1.glb", "bush2.glb", "cactus_flower1.glb"],
    scale: 0.05,
    itemCount: 15,
    materialModifier: (a) => {
      a.metalness = 0.0;
      a.roughness = 1.0;
      let mult = 2;
      a.color.r = Math.min(a.color.r * mult, 1);
      a.color.g = Math.min(a.color.g * mult, 1);
      a.color.b = Math.min(a.color.b * mult, 1);
      return a;
    },
    moveY: -0.002,
    positionCondition: (item, pos, height, color) => {
      return (color > 0.35)
    },

  }
}

const defaultOptionsDesert = {
  subs: 5,
  radius: 1,
  shadow: true,
  noiseSettings: {
    octaves: 3,
    min: 0.65,
    max: 0.9,
    scale: 1,
    pow: 0.8,
    persistence: 0.5
  },
  material: {
    metalness: 0.0,
    roughness: 0.9
  },
  gradientSettings: {
    stops: [
      Gradient.colorStop(0.0, 0x664400),
      Gradient.colorStop(0.3, 0x996600),
      Gradient.colorStop(0.6, 0xccaa00),
      Gradient.colorStop(0.8, 0xffcc00)
    ]
  },

  water: {
    enabled: true,
    height: 0.74,
    noiseSettings: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    },
    gradientSettings: {
      between: [Gradient.color(0x000022), Gradient.color(0x4477ff)]
    },
    morph: true,
    morphNoise: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    }
  },

  vegetation: {
    enabled: true,
    folder: "https://1florki.github.io/low_poly_proc_gen/0_1/vegetation/",
    models: ["plant1.glb", "plant2.glb", "plant3.glb", "palm1.glb", "palm2.glb", "palm3.glb", "palm4.glb", "grass1.glb", "grass2.glb", "grass3.glb", "cactus1.glb", "cactus2.glb", "cactus3.glb", "cactus4.glb", "cactus5.glb", "cactus_flower1.glb", "cactus_flower2.glb", "cactus_flower3.glb"],
    scale: 0.05,
    itemCount: 8,
    materialModifier: (a) => {
      a.metalness = 0.0;
      a.roughness = 1.0;
      let mult = 2;
      a.color.r = Math.min(a.color.r * mult, 1);
      a.color.g = Math.min(a.color.g * mult, 1);
      a.color.b = Math.min(a.color.b * mult, 1);
      return a;
    },
    moveY: -0.005,
    positionCondition: (item, pos, height, color) => {
      return Math.random() < Math.pow(1 - color, 4) && height > 0.74;
    },

  }
}

const defaultOptionsForest = {
  subs: 5,
  radius: 1,
  shadow: true,
  noiseSettings: {
    octaves: 4,
    min: 0.7,
    max: .95,
    scale: 1,
    pow: 1,
    persistence: 0.5
  },
  material: {
    metalness: 0.0,
    roughness: 0.9
  },
  gradientSettings: {
    stops: [
      Gradient.colorStop(0.0, 0x002200),
      Gradient.colorStop(0.3, 0x006600),
      Gradient.colorStop(0.8, 0x00aa44),
      Gradient.colorStop(0.9, 0x006633)
    ]
  },

  water: {
    enabled: true,
    height: 0.79,
    noiseSettings: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    },
    gradientSettings: {
      between: [Gradient.color(0x000022), Gradient.color(0x4477ff)]
    },
    morph: true,
    morphNoise: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    }
  },

  vegetation: {
    enabled: true,
    folder: "https://1florki.github.io/low_poly_proc_gen/0_1/vegetation/",
    models: ["plant1.glb", "plant2.glb", "plant3.glb", "plant4.glb", "grass1.glb", "grass2.glb", "grass3.glb", "birch1.glb", "birch2.glb", "birch3.glb", "birch4.glb", "birch5.glb", "birch_dead1.glb", "birch_dead2.glb", "bush1.glb", "bush2.glb", "bush_berries1.glb", "bush_berries2.glb", "pine1.glb", "pine2.glb", "pine3.glb", "pine4.glb", "treestump.glb", "treestump_moss.glb", "rock1.glb", "rock2.glb", "rock3.glb", "rock_moss1.glb", "rock_moss2.glb", "commontree1.glb", "commontree3.glb", "commontree4.glb", "commontree5.glb", "commontree_dead1.glb", "commontree_dead2.glb", "willow1.glb", "willow2.glb", "willow3.glb", "willow_dead1.glb", "willow_dead2.glb"],
    scale: 0.05,
    itemCount: 10,
    materialModifier: (a) => {
      a.metalness = 0.0;
      a.roughness = 1.0;
      let mult = 1.5;
      a.color.r = Math.min(a.color.r * mult, 1);
      a.color.g = Math.min(a.color.g * mult, 1);
      a.color.b = Math.min(a.color.b * mult, 1);
      return a;
    },
    moveY: -0.005,
    positionCondition: (item, pos, height, color) => {
      return height > 0.8;
    },

  }
}

const defaultOptionsForestMountains = {
  subs: 5,
  radius: 1,
  shadow: true,
  noiseSettings: {
    octaves: 5,
    min: 0.7,
    max: 1.0,
    scale: 0.7,
    pow: 2.5,
    persistence: 0.5
  },
  material: {
    metalness: 0.0,
    roughness: 0.9
  },
  gradientSettings: {
    stops: [
      Gradient.colorStop(0.0, 0x002200),
      Gradient.colorStop(0.3, 0x006600),
      Gradient.colorStop(0.4, 0x888888),
      Gradient.colorStop(0.8, 0xffffff)
    ]
  },

  water: {
    enabled: true,
    height: 0.74,
    noiseSettings: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    },
    gradientSettings: {
      between: [Gradient.color(0x000022), Gradient.color(0x4477ff)]
    },
    morph: true,
    morphNoise: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    }
  },

  vegetation: {
    enabled: true,
    folder: "https://1florki.github.io/low_poly_proc_gen/0_1/vegetation/",
    models: ["plant1.glb", "plant2.glb", "plant3.glb", "plant4.glb", "grass1.glb", "grass2.glb", "grass3.glb", "birch1.glb", "birch2.glb", "birch3.glb", "birch4.glb", "birch5.glb", "birch_dead1.glb", "birch_dead2.glb", "bush1.glb", "bush2.glb", "bush_berries1.glb", "bush_berries2.glb", "pine1.glb", "pine2.glb", "pine3.glb", "pine4.glb", "rock1.glb", "rock2.glb", "rock3.glb", "rock4.glb", "rock5.glb", "rock6.glb", "rock_moss1.glb", "rock_moss2.glb", "rock_moss3.glb", "rock_moss4.glb", "commontree1.glb", "commontree3.glb", "commontree4.glb", "commontree5.glb", "commontree_dead1.glb", "commontree_dead2.glb", "pine_snow1.glb", "pine_snow2.glb", "pine_snow3.glb", "pine_snow4.glb", "commontree_snow1.glb", "commontree_snow2.glb", "commontree_snow3.glb", "birch_snow1.glb", "birch_snow2.glb"],
    scale: 0.04,
    itemCount: 10,
    materialModifier: (a) => {
      a.metalness = 0.0;
      a.roughness = 1.0;
      let mult = 1.5;
      a.color.r = Math.min(a.color.r * mult, 1);
      a.color.g = Math.min(a.color.g * mult, 1);
      a.color.b = Math.min(a.color.b * mult, 1);
      return a;
    },
    moveY: -0.005,
    positionCondition: (item, pos, height, color) => {
      return height > 0.75 && (item.name.includes("snow") ? height > 0.8 : height < 0.85);
    },

  }
}

const defaultOptionsSnowForest = {
  subs: 5,
  radius: 1,
  shadow: true,
  noiseSettings: {
    octaves: 3,
    min: 0.65,
    max: 0.9,
    scale: 1,
    pow: 1.5,
    persistence: 0.5
  },
  material: {
    metalness: 0.0,
    roughness: 0.8
  },
  gradientSettings: {
    stops: [
      //Gradient.colorStop(0.2, 0xaaddcc),
      Gradient.colorStop(0.3, 0xffffff)
    ]
  },

  water: {
    enabled: true,
    height: 0.69,
    noiseSettings: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    },
    gradientSettings: {
      between: [Gradient.color(0x88aaff), Gradient.color(0xaaccff)]
    },
    morph: false,
  },

  vegetation: {
    enabled: true,
    folder: "https://1florki.github.io/low_poly_proc_gen/0_1/vegetation/",
    models: ["birch_dead_snow1.glb", "birch_dead_snow2.glb", "birch_dead_snow3.glb", "birch_dead_snow4.glb",
            "rock1.glb", "rock2.glb", "rock3.glb", "rock4.glb", "rock5.glb", "rock6.glb",
            "rock_snow1.glb", "rock_snow2.glb", "rock_snow3.glb", "rock_snow4.glb",
            "pine_snow1.glb", "pine_snow2.glb", "pine_snow3.glb", "pine_snow4.glb", "pine_snow5.glb",
            "commontree_snow1.glb", "commontree_snow2.glb", "commontree_snow3.glb", "commontree_snow4.glb",
            "birch_snow1.glb", "birch_snow2.glb", "birch_snow3.glb", "birch_snow4.glb", "bush_snow1.glb", "bush_snow1.glb", "commontree_dead_snow1.glb", "commontree_dead_snow2.glb", "commontree_dead_snow3.glb", "commontree_dead_snow4.glb", "grass1.glb", "grass2.glb", "grass3.glb", "treestump_snow.glb", "willow_dead_snow1.glb", "willow_dead_snow2.glb", "willow_snow1.glb", "willow_snow2.glb", "willow_snow3.glb", "woodlog_snow.glb"],
    scale: 0.05,
    itemCount: 13,
    materialModifier: (a) => {
      a.metalness = 0.0;
      a.roughness = 0.7;
      let mult = 2;
      a.color.r = Math.min(a.color.r * mult, 1);
      a.color.g = Math.min(a.color.g * mult, 1);
      a.color.b = Math.min(a.color.b * mult, 1);
      return a;
    },
    moveY: -0.005,
    positionCondition: (item, pos, height, color) => {
      return height > 0.70
    },

  }
}

const defaultOptionsAutumnForest = {
  subs: 5,
  radius: 1,
  shadow: true,
  noiseSettings: {
    octaves: 4,
    min: 0.70,
    max: 0.95,
    scale: 1,
    pow: 1.5,
    persistence: 0.5
  },
  material: {
    metalness: 0.0,
    roughness: 1.0
  },
  gradientSettings: {
    stops: [
      Gradient.colorStop(0.0, 0x334400),
      Gradient.colorStop(0.3, 0x336600),
      Gradient.colorStop(0.65, 0xbb5522),
      Gradient.colorStop(0.8, 0xddaa44),
      Gradient.colorStop(0.9, 0x882233)
    ]
  },

  water: {
    enabled: true,
    height: 0.75,
    noiseSettings: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    },
    gradientSettings: {
      between: [Gradient.color(0x000022), Gradient.color(0x4477ff)]
    },
    morph: true,
    morphNoise: {
      min: 0.995,
      max: 1.005,
      scale: 5,
      oct: 2,
      per: 0.5,
      pow: 2
    }
  },


  vegetation: {
    enabled: true,
    folder: "https://1florki.github.io/low_poly_proc_gen/0_1/vegetation/",
    models: ["birch_autumn1.glb", "birch_autumn2.glb", "birch_autumn3.glb", "birch_autumn4.glb",
            "rock1.glb", "rock2.glb", "rock3.glb", "rock4.glb", "rock5.glb", "rock_moss1.glb", "rock_moss2.glb",
            "pine_autumn1.glb", "pine_autumn2.glb", "pine_autumn3.glb", "pine_autumn4.glb", "pine_autumn5.glb",
            "commontree_autumn1.glb", "commontree_autumn2.glb", "commontree_autumn3.glb", "commontree_autumn4.glb", "bush1.glb", "bush1.glb", "bush_berries1.glb", "bush_berries2.glb", "commontree_dead1.glb", "commontree_dead2.glb", "commontree_dead3.glb", "commontree_dead4.glb", "grass1.glb", "grass2.glb", "grass3.glb", "treestump.glb", "willow_dead1.glb", "willow_dead2.glb", "willow_autumn1.glb", "willow_autumn2.glb", "willow_autumn3.glb", "woodlog.glb"],
    scale: 0.05,
    itemCount: 11,
    materialModifier: (a) => {
      a.metalness = 0.0;
      a.roughness = 1.0;
      let mult = 1.5;
      a.color.r = Math.min(a.color.r * mult, 1);
      a.color.g = Math.min(a.color.g * mult, 1);
      a.color.b = Math.min(a.color.b * mult, 1);
      return a;
    },
    moveY: -0.005,
    positionCondition: (item, pos, height, color) => {
      return height > 0.75
    },

  }
}

/*

heightfield expects object with methods:
- get(x, y, z) -> height multiplier at position (x, y, z)
- getColor(x, y, z) -> between 0 - 1 for color from color gradient

preset expects

*/

const allPresets = {
  forest: defaultOptionsForest,
  snowforest: defaultOptionsSnowForest,
  autumnforest: defaultOptionsAutumnForest,
  mountainforest: defaultOptionsForestMountains,
  desert: defaultOptionsDesert,
  islands: defaultOptionsIslands
}


export class Planet {
  static presets() {
    return allPresets;
  }
  constructor(opts) {
    opts = opts || {};

    this.preset = {};
    if (opts.preset) {
      this.preset = allPresets[opts.preset];
    } else {
      let keys = Object.keys(allPresets);
      let i = Math.floor(Math.random() * keys.length);
      this.preset = allPresets[keys[i]];
    }
    this.subs = (opts.subs || this.preset.subs);
    this.radius = opts.radius || this.preset.radius;
    let settings = opts.noiseSettings || this.preset.noiseSettings;
    if (opts.seed) settings.seed = opts.seed;
    this.heightfield = opts.heightfield || new Noise(opts.noiseSettings || this.preset.noiseSettings);

    this.createPlanet(opts);

    this.rotate = opts.rotate || this.preset.rotate;
  }

  createPlanet(opts) {
    this.createTerrain(opts);
    if ((opts.shadow != undefined ? opts.shadow == true : this.preset.shadow == true) && opts.light != undefined) {
      this.createTerrainShadow(opts.light);
    }
    this.createWater(opts.water);
    this.createVegetation(opts.vegetation);
    return this.mesh;
  }

  createTerrain(opts) {
    this.gradient = new Gradient(opts.gradientSettings || this.preset.gradientSettings);
    this.sphere = new LPSphere({
      radius: this.radius,
      subs: this.subs
    });

    this.sphere.apply(this.heightfield, this.gradient);

    this.mesh = this.sphere.mesh();

    this.mesh.material.metalness = opts.material ? (opts.material.metalness || this.preset.material.metalness) : this.preset.material.metalness;
    this.mesh.material.roughness = opts.material ? (opts.material.roughness || this.preset.material.roughness) : this.preset.material.roughness;

    return this.mesh;
  }

  createWater(opts) {
    opts = opts || this.preset.water;

    if (opts.enabled == false) return;

    let waterSphere = new LPSphere({
      subs: this.subs - 1,
      radius: this.radius * opts.height || this.preset.water.height
    });

    let gradient = new Gradient(opts.gradientSettings || this.preset.water.gradientSettings);
    let heightfield = opts.heightfield || new Noise(opts.noiseSettings || this.preset.water.noiseSettings);
    waterSphere.apply(heightfield, gradient);

    let waterGeo = waterSphere.geo();

    if (opts.morph) { // default true
      let waterSphere2 = new LPSphere({
        subs: this.subs - 1,
        radius: this.radius * opts.height || this.preset.water.height
      });
      heightfield = opts.morphHeighfield || new Noise(opts.morphNoise || this.preset.water.morphNoise);
      waterSphere2.apply(heightfield);

      let morphGeo = waterSphere2.geo();
      Helper.addMorphToGeo(waterGeo, morphGeo);
      this.waterMorph = true;
    }

    let water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
      morphTargets: opts.morph || false,
      morphNormals: opts.morph || false,
      transparent: true,
      opacity: 0.8,
      vertexColors: true
    }))

    this.mesh.add(water);
    this.water = water;

    return water;
  }

  createVegetation(opts) {
    opts = opts || this.preset.vegetation;
    let toLoad = {};
    opts.models = opts.models || this.preset.vegetation.models;
    for (let m of opts.models) {
      toLoad[m] = (opts.folder || this.preset.vegetation.folder) + m;
    }
    this.gltf = new GLTFHelper(toLoad, () => {
      this.gltf.changeMaterialsAll(opts.materialModifier || this.preset.vegetation.materialModifier)

      for (let m of opts.models) {
        let item = this.gltf.models[m];
        item.name = m;

        this.addItemRandomly(item, opts.positionCondition || this.preset.vegetation.positionCondition, opts.itemCount || this.preset.vegetation.itemCount, opts.scale || this.preset.vegetation.scale, opts.moveY || this.preset.vegetation.moveY);
      }
    })
  }

  createTerrainShadow(light, bias, dist) {
    this.sunlight = light;

    this.shadow = new ShadowVolumeMesh(this.mesh.geometry);
    this.shadow.setLight(light);
    this.shadow.setShadowBias(bias || 0.01);
    this.shadow.setShadowDistance(dist || 1);
    this.mesh.add(this.shadow);
  }

  renderWithShadow(renderer, scene, cam, context, light, intensity) {
    context = context || renderer.getContext();
    light = light || this.sunlight;
    intensity = intensity || 1.0
    ShadowVolumeMesh.renderWithShadows(renderer, context, scene, cam, light, intensity);
  }

  getRandomPos(item, condition, maxTries) {
    maxTries = maxTries || 100;
    condition = condition || (() => {
      true
    });

    for (let i = 0; i < maxTries; i++) {
      let pos = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      pos.setLength(this.radius);

      let h = this.heightfield.get(pos.x, pos.y, pos.z);
      let c = this.heightfield.getColor(pos.x, pos.y, pos.z);
      if (condition(item, pos, h, c)) return pos;
    }
    return undefined;
  }

  addItemRandomly(item, checkPositionFunc, num, scl, moveY) {
    for (let i = 0; i < num; i++) {
      let pos = this.getRandomPos(item, checkPositionFunc);
      if (pos) {
        let s = item.clone();
        s.scale.set(scl, scl, scl);
        this.addObjectToPlanet(s, pos, moveY, Math.random() * Math.PI * 2, Math.random() * 0.1 - 0.05);
      }
    }
  }


  animate(time) {
    if (this.waterMorph) this.water.morphTargetInfluences[0] = (Math.sin(time * 2) + 1) / 2;

    if (this.clouds) {
      this.moveClouds();
    }

    if (this.rotate) {
      this.mesh.rotation.y = time * this.rotate * 0.1;
    }
  }

  makeClouds(num, light) {
    this.clouds = [];
    for (let i = 0; i < num; i++) {

      let pos = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      let c = this.createCloud(undefined, light)
      this.addObjectToPlanet(c, pos, 0.25, Math.random() * 7);
      this.clouds.push(c);
    }
  }

  moveClouds(speed) {
    speed = (speed || 1) * (0.0003 + Math.random() * 0.0002);
    let forward = new THREE.Vector3(0, 0, speed);
    for (let i = 0; i < this.clouds.length; i++) {
      let c = this.clouds[i];
      this.moveObjectLocal(c, forward);
    }
  }

  createCloud(scl, light) {
    let i = 0;
    let cloud, cloudscl;
    let num = Math.random() * 6 + 1;
    while (i < num) {
      scl = scl || 0.02 + Math.random() * 0.15;
      let sphere = new LPSphere({
        radius: 1,
        subs: 1
      });
      let noise = new Noise({
        min: 0.5
      });
      let gradient = Gradient.between([Gradient.color(0x999999), Gradient.color(0xffffff)]);
      sphere.apply(noise, gradient);

      let xscl = Math.random() * 0.6 + 0.6;
      let zscl = Math.random() * 0.6 + 0.6;
      sphere.scale([scl * xscl, 0.3 * scl, scl * zscl]);
      let mesh = sphere.mesh();
      mesh.material.transparent = true;
      mesh.material.opacity = 0.4;
      //mesh.material.side = THREE.DoubleSide
mesh.material.emissive = new THREE.Color(0xffffff)
      if (cloud == undefined) {
        cloud = mesh;
        cloudscl = scl;
      mesh.material.emissiveIntensity = Math.random() * 0.3;
      } else {
        cloud.add(mesh);
        let x = (Math.random() - 0.5) * cloudscl * 2;
        let z = (Math.random() - 0.5) * cloudscl * 2;
        mesh.position.set(x, 0, z);
      mesh.material.emissiveIntensity = cloud.material.emissiveIntensity
      }
      i++;
    }
    /*
    
  let shadow = new ShadowVolumeMesh(mesh.geometry);
  shadow.setLight(light);
  shadow.setShadowBias(0.01)
  shadow.setShadowDistance(1.5)
    mesh.add(shadow);
    */

    return cloud;
  }


  addContainerObjectToPlanet(item, pos, aboveGround, yaw, pitch) {
    let container = new THREE.Object3D();
    this.addObjectToPlanet(container, pos, aboveGround, yaw, pitch);
    container.add(item);
    return container;
  }

  // add object to planet at position
  // and update rotation (up vector away from planet)
  // also takes height above ground 
  //(0 for on ground, if undefined doesn't change height)
  // and local yaw and pitch
  addObjectToPlanet(item, pos, aboveGround, yaw, pitch) {
    if (this.mesh == undefined || item == undefined) return;

    this.mesh.add(item);
    item.position.set(0, 1, 0);

    item.yaw = yaw || 0;
    item.pitch = pitch || 0;
    item.aboveGround = aboveGround;

    this.updatePositionObject(item, new THREE.Vector3(0, 1, 0));
    if (pos) this.updatePositionObject(item, pos);
    return item;
  }

  // sets new position for an object on planet
  // and updates rotation 
  // (so that the up vector points away from planet)

  // optinal rotate planet in oposite direction
  updatePositionObject(item, newPos, planetRotate, boundFunction) {
    if (item == undefined) return;
    if (item.rotBuffer == undefined) {
      item.rotBuffer = new THREE.Quaternion();
    }

    item.oldPosition = item.position.clone();
    item.position.copy(newPos);
    if (item.aboveGround != undefined) {
      newPos.normalize();
      let h = this.heightfield.get(newPos.x, newPos.y, newPos.z) + item.aboveGround;;
      item.position.setLength(h);
    }
    if (boundFunction) {
      boundFunction(item.position);
    }

    let currentRotation = new THREE.Quaternion();
    currentRotation.setFromUnitVectors(
      item.oldPosition.clone().normalize(),
      item.position.clone().normalize()
    );

    item.rotBuffer.premultiply(currentRotation);
    item.quaternion.copy(item.rotBuffer);

    if (planetRotate == true) {
      this.mesh.quaternion.copy(item.rotBuffer);
      this.mesh.quaternion.conjugate();
    }

    item.localRotation = item.localRotation || new THREE.Quaternion();

    item.localRotation.setFromAxisAngle(pitchAxis, item.yaw || 0);
    item.quaternion.multiply(item.localRotation);
    item.localRotation.setFromAxisAngle(yawAxis, item.pitch || 0);
    item.quaternion.multiply(item.localRotation);
  }

  // moves an object on the planet depending on rotation of item
  // ([0,0,1] moves object forward locally)

  // optinal rotate planet in oposite direction
  moveObjectLocal(item, movement, planetRotate, boundFunction) {
    movement.applyQuaternion(item.quaternion);
    let newPos = item.position.clone();
    newPos.add(movement);
    this.updatePositionObject(item, newPos, planetRotate, boundFunction);
  }
}
