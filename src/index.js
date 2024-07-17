import * as THREE from "three";
import fragment from "./fragment.glsl";
import vertex from "./vertex.glsl";
import fragmentFBO from "./fragmentFBO.glsl";
import vertexFBO from "./vertexFBO.glsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { VGesture } from "@dvgs/vgesture";
import { PointGesturePlugin } from "./pointGesturePlugin";

const vgesture = new VGesture({ disableHelper: true });
export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.color = 0xff0000;

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerPos = new THREE.Vector3();

    this.whiteScene = new THREE.Scene();
    this.whiteBg = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.whiteScene.add(this.whiteBg);
    this.whiteBg.position.z = -1;

    this.box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    // this.whiteScene.add(this.box);
    this.whiteTarget = new THREE.WebGLRenderTarget(this.width, this.height);

    this.time = 0;
    this.isPlaying = true;
    this.setupPipeline();
    this.addObjects();
    this.resize();
    this.mouseEvents();
    this.render();
    this.setupResize();
    this.init();
  }

  async init() {
    await vgesture.initialize({});

    const pointGesturePlugin = new PointGesturePlugin();

    vgesture.register(pointGesturePlugin);
    vgesture.startDetection();
  }
  settings() {
    let that = this;
    this.settings = {
      progress: 0,
      color: this.color,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.addColor(this.settings, "color", "#ff00ff").onChange((v) => {
      this.color = new THREE.Vector4(v / 1000000 / 255, v / 10000 / 255, v / 100 / 255, (v % 100) / 255);
    });
  }

  setupPipeline() {
    this.sourceTarget = new THREE.WebGLRenderTarget(this.width, this.height);
    this.targetA = new THREE.WebGLRenderTarget(this.width, this.height);
    this.targetB = new THREE.WebGLRenderTarget(this.width, this.height);

    this.renderer.setRenderTarget(this.whiteTarget);
    this.renderer.render(this.whiteScene, this.camera);

    this.fboScene = new THREE.Scene();
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: this.time,
        },
        uDiffuse: {
          value: null,
        },
        uPrev: {
          value: this.whiteTarget.texture, /// previous texture
        },
        uResolution: {
          value: new THREE.Vector4(this.width, this.height, 1, 1),
        },
        uColor: {
          value: new THREE.Vector4(),
        },
      },
      vertexShader: vertexFBO,
      fragmentShader: fragmentFBO,
    });

    this.fboQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fboMaterial);
    this.fboScene.add(this.fboQuad);

    //final : only for rendering somthing. just to output some texture

    this.finalScene = new THREE.Scene();
    this.finalQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        map: this.targetA.texture,
      }),
    );

    this.finalScene.add(this.finalQuad);
  }
  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  mouseEvents() {
    this.raycastPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
    );

    this.dummy = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 30, 30),
      new THREE.MeshBasicMaterial({
        color: 0xffffffff,
        // map: new THREE.TextureLoader().load(particle),
        transparent: true,
      }),
    );

    this.scene.add(this.dummy);
    window.addEventListener("pointGesture", (e) => {
      if ("indexTip" in e) {
        this.pointer.x = -(e.indexTip?.x / this.width) * 2 + 1;
        this.pointer.y = -(e.indexTip?.y / this.height) * 2 + 1;
      }

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects([this.raycastPlane]);
      if (intersects.length > 0) {
        this.dummy.position.copy(intersects[0].point);
      }
    });
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives: enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: {
          type: "f",
          value: 0,
        },
        resolution: {
          type: "v4",
          value: new THREE.Vector4(),
        },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.plane = new THREE.Mesh(this.geometry, this.material);

    // this.scene.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }
  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) {
      return;
    }
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;

    const x = this.render.bind(this);
    // setTimeout(function () {
    requestAnimationFrame(x);
    // }, 1000 / 30);
    // requestAnimationFrame(this.render.bind(this));

    //rendering the source
    // black background with white ball -> give it to source target (black & white texture)
    this.renderer.setRenderTarget(this.sourceTarget);
    this.renderer.render(this.scene, this.camera);

    // running framebuffer output on same texture
    //below two, only for calculation purpose.
    this.renderer.setRenderTarget(this.targetA); // i want this to run the render loop on the same texture. to do this, create render target a ,b
    this.renderer.render(this.fboScene, this.fboCamera);

    this.fboMaterial.uniforms.uTime.value = this.time;
    this.fboMaterial.uniforms.uDiffuse.value = this.sourceTarget.texture;
    this.fboMaterial.uniforms.uPrev.value = this.targetA.texture;

    //final render
    this.finalQuad.material.map = this.targetA.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.finalScene, this.fboCamera);

    let temp = this.targetA;
    this.targetA = this.targetB;
    this.targetB = temp;

    // i want above to run on same texture. -> create two targets
    //final: just outputting
  }
}

const sketch = new Sketch({
  dom: document.getElementById("container"),
});

sketch.render();
