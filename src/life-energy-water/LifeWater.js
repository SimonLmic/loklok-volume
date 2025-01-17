import createContext from "pex-context";
import createCamera from "pex-cam/perspective";

import { Clock } from "three";
import createOrbiter from "pex-cam/orbiter";
import createPlane from "primitive-plane";

// import mat4 from "pex-math/mat4";
// import vec3 from "pex-math/vec3";

const quadPositions = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

const quadTexCoords = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

const quadFaces = [
  [0, 1, 2],
  [0, 2, 3],
];

export class LifeWater {
  constructor(mini) {
    this.mini = mini;
    this.rect = mini.getRect();
    this.ctx = createContext({
      pixelRatio: 2,
      width: this.rect.width,
      height: this.rect.height,
    });
    mini.set("ctx", this.ctx);
    mini.onClean(() => {
      this.ctx.dispose();
      console.log("cleanup ctx");
    });

    mini.onResize(() => {
      this.rect = mini.getRect();
      this.ctx.set({
        pixelRatio: 2,
        width: this.rect.width,
        height: this.rect.height,
      });
    });

    mini.domElement.appendChild(this.ctx.gl.canvas);

    //
    this.setup();
  }
  setup() {
    let { ctx, mini } = this;

    let make2DTexture = ({
      name,
      width,
      height,
      data,
      format = ctx.PixelFormat.RGBA16F,
    }) => {
      let conf = {
        width: width,
        height: height,
        pixelFormat: format,
        encoding: ctx.Encoding.Linear,
      };
      if (data) {
        conf.data = data;
        // conf.flipY = true;
      }

      let texture = ctx.texture2D(conf);

      console.log("texture-2d", name, format, width, height);

      let passWithClear = ctx.pass({
        clearColor: [0, 0, 0, 0],
        color: [texture],
      });

      let passWithoutClear = ctx.pass({
        color: [texture],
      });

      let viewport = [0, 0, width, height];

      return {
        name,
        texture,
        width,
        height,
        passWithClear,
        passWithoutClear,
        viewport,
      };
    };

    let make3DTexture = ({
      name,
      size,
      slicesPerRow,
      slot = 0,
      seedType = "custom",
      // makeParticleUV = false,
      debugCanvas2D = false,
    }) => {
      // make 3D texture
      // var size = SIZE;
      // var slicesPerRow = COLS;

      var numRows = Math.floor((size + slicesPerRow - 1) / slicesPerRow);
      var pixels = new Uint8Array(size * slicesPerRow * size * numRows * 4);
      var pixelsAcross = slicesPerRow * size;

      // let r0 = () => Math.random() * 2.0 - 1.0;
      for (var slice = 0; slice < size; ++slice) {
        var row = Math.floor(slice / slicesPerRow);
        var xOff = (slice % slicesPerRow) * size;
        var yOff = row * size;
        for (var y = 0; y < size; ++y) {
          for (var x = 0; x < size; ++x) {
            var offset = ((yOff + y) * pixelsAcross + xOff + x) * 4;
            if (seedType === "index") {
              pixels[offset + 0] = Math.floor((x / size) * 255);
              pixels[offset + 1] = Math.floor((y / size) * 255);
              pixels[offset + 2] = Math.floor((slice / size) * 255);
              pixels[offset + 3] = 255;
            } else {
              pixels[offset + 0] = (x / size) * 0;
              pixels[offset + 1] = (y / size) * 0;
              pixels[offset + 2] = (slice / size) * 0;
              pixels[offset + 3] = 0;
            }
          }
        }
      }

      let texSizeX = size * slicesPerRow;
      let texSizeY = size * numRows;

      // put this in a 2d canvas for debugging
      var dataCavans = document.createElement("canvas");
      dataCavans.width = texSizeX;
      dataCavans.height = texSizeY;
      var ctx2d = dataCavans.getContext("2d");
      var imageData = ctx2d.getImageData(
        0,
        0,
        dataCavans.width,
        dataCavans.height
      );
      var numBytes = dataCavans.width * dataCavans.height * 4;
      for (var ii = 0; ii < numBytes; ++ii) {
        imageData.data[ii] = pixels[ii];
      }

      ctx2d.putImageData(imageData, 0, 0);

      dataCavans.style.position = "absolute";
      dataCavans.style.top = dataCavans.height * slot + "px";
      dataCavans.style.left = 0 + "px";
      dataCavans.style.maxWidth = "calc(80vw)";

      if (debugCanvas2D) {
        this.mini.domElement.appendChild(dataCavans);
      }

      let res = false;

      let opts2d = {
        name,
        width: texSizeX,
        height: texSizeY,
        format: ctx.PixelFormat.RGBA16F,
      };

      if (seedType === "index") {
        // opts2d.data = pixels;
        // opts2d.format = ctx.PixelFormat.RGBA8;

        opts2d.data = dataCavans;
        opts2d.format = ctx.PixelFormat.RGBA16F;
      }

      res = make2DTexture(opts2d);

      return {
        ...res,

        size,
        slicesPerRow,
        numRows,

        canvas: dataCavans,

        pixels,
      };
    };

    let makeUV2 = ({ width, height }) => {
      let uv2 = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          uv2.push(y / height, x / width);
        }
      }

      return {
        uv2: ctx.vertexBuffer(uv2),
        count: uv2.length / 2,
      };
    };

    let makeUV3 = ({ size, slicesPerRow }) => {
      let uv3 = [];
      // var numRows = Math.floor((size + slicesPerRow - 1) / slicesPerRow);
      var pixelsAcross = slicesPerRow * size;

      for (var slice = 0; slice < size; slice++) {
        var row = Math.floor(slice / slicesPerRow);
        var xOff = (slice % slicesPerRow) * size;
        var yOff = row * size;
        for (var y = 0; y < size; y++) {
          for (var x = 0; x < size; x++) {
            for (let repeat = 0; repeat < 5; repeat++) {
              var offset = ((yOff + y) * pixelsAcross + xOff + x) * 4;
              uv3[offset + 0] = x / size;
              uv3[offset + 1] = y / size;
              uv3[offset + 2] = slice / size;
              uv3[offset + 3] = 0.0;
            }
          }
        }
      }

      return {
        uv3: ctx.vertexBuffer(uv3),
        count: uv3.length / 3,
      };
    };

    const camera = createCamera({
      fov: Math.PI * 0.5,
      aspect: this.rect.width / this.rect.height,
      position: [0, 0.0, 10],
      target: [0, 0, 0],
      near: 0.1,
      far: 500,
    });
    const debugCamera = createCamera({
      fov: Math.PI * 0.5,
      aspect: 1,
      position: [0, 0.0, 10],
      target: [0, 0, 0],
      near: 0.1,
      far: 500,
    });
    mini.onResize(() => {
      this.rect = mini.getRect();
      camera.set({
        aspect: this.rect.width / this.rect.height,
      });
    });

    createOrbiter({ camera: camera, distance: 5, element: this.ctx.gl.canvas });
    createOrbiter({
      camera: debugCamera,
      distance: 5,
      element: this.ctx.gl.canvas,
    });

    let clock = new Clock();
    this.dT = 0.00167;
    this.eT = 0;
    mini.onLoop(() => {
      this.dT = clock.getDelta();
      this.eT = clock.getElapsedTime();
    });

    const clearScreenCmd = {
      name: "clearScreen",
      pass: ctx.pass({
        clearColor: [0.0, 0.0, 0.0, 1],
      }),
    };

    const debugDataTexture2DCmd = {
      name: "debugDataTexture2DCmd",
      pipeline: ctx.pipeline({
        blend: true,
        vert: require("./shaders/screen-image.vert"),
        frag: require("./shaders/screen-image.frag"),
      }),
      attributes: {
        aPosition: ctx.vertexBuffer(quadPositions),
        aTexCoord0: ctx.vertexBuffer(quadTexCoords),
      },
      indices: ctx.indexBuffer(quadFaces),
      uniforms: {
        uTexture: null,
      },
    };

    const schema32 = make3DTexture({
      name: "schema32",
      size: 32,
      slicesPerRow: 32,
      seedType: "index",
    });

    const null32 = make3DTexture({
      name: "null32",
      size: 32,
      slicesPerRow: 32,
    });

    const varLookup = make3DTexture({
      name: "varLookup",
      size: 32,
      slicesPerRow: 32,
    });

    const varPos = make3DTexture({
      name: "varPos",
      size: 32,
      slicesPerRow: 32,
    });

    const varPosTemp = make3DTexture({
      name: "varPos",
      size: 32,
      slicesPerRow: 32,
    });

    const varVel = make3DTexture({
      name: "varVel",
      size: 32,
      slicesPerRow: 32,
    });

    const varVelTemp = make3DTexture({
      name: "varVelTemp",
      size: 32,
      slicesPerRow: 32,
    });

    const varGravity = make3DTexture({
      name: "varGravity",
      size: 32,
      slicesPerRow: 32,
    });

    const varMarker = make3DTexture({
      name: "varMarker",
      size: 32,
      slicesPerRow: 32,
    });

    const varTemp1 = make3DTexture({
      name: "varTemp1",
      size: 32,
      slicesPerRow: 32,
    });

    const varTemp2 = make3DTexture({
      name: "varTemp2",
      size: 32,
      slicesPerRow: 32,
    });

    const debug32UV3 = makeUV3({
      size: schema32.size,
      slicesPerRow: schema32.slicesPerRow,
    });

    const debugDataTexture3DCmd = {
      name: "debugDataTexture3DCmd",
      pipeline: ctx.pipeline({
        blend: true,
        vert: require("./shaders/debug-tex3d.vert"),
        frag: require("./shaders/debug-tex3d.frag"),
        primitive: ctx.Primitive.Points,
      }),
      attributes: {
        uv3: debug32UV3.uv3,
      },
      count: debug32UV3.count,
      uniforms: {
        uProjectionMatrix: debugCamera.projectionMatrix,
        uViewMatrix: debugCamera.viewMatrix,
        tex3dSrc: null,
        size: schema32.size,
        numRows: schema32.numRows,
        slicesPerRow: schema32.slicesPerRow,
      },
    };

    const debugTexture2D = ({ inputTexture, slot = 0 }) => {
      ctx.submit(debugDataTexture2DCmd, {
        uniforms: {
          uTexture: inputTexture,
        },
        viewport: [350 * slot, 0, 350, 350],
      });
    };

    const debugTexture3Ds32 = ({ inputTexture, slot = 0 }) => {
      ctx.submit(debugDataTexture3DCmd, {
        uniforms: {
          tex3dSrc: inputTexture,
        },
        viewport: [350 * slot, 0, 350, 350],
      });
    };

    const debugTexture3Ds32FullScreen = ({ inputTexture }) => {
      ctx.submit(debugDataTexture3DCmd, {
        uniforms: {
          tex3dSrc: inputTexture,
          uProjectionMatrix: camera.projectionMatrix,
          uViewMatrix: camera.viewMatrix,
        },
      });
    };

    // const plane = createPlane(1, 1, 32 * 32, 1);

    const gpuIO = {
      attributes: {
        aPosition: ctx.vertexBuffer(quadPositions),
        aUV: ctx.vertexBuffer(quadTexCoords),
      },
      indices: ctx.indexBuffer(quadFaces),

      // attributes: {
      //   aPosition: ctx.vertexBuffer(plane.positions),
      //   aUV: ctx.vertexBuffer(plane.uvs),
      // },
      // indices: ctx.indexBuffer(plane.cells),

      pipeline: ctx.pipeline({
        vert: require("./shaders/general-io-3d2d.vert"),
        frag: require("./shaders/general-io-3d2d.frag"),
        blend: true,
      }),

      uniforms: {
        tex3dRes2: [schema32.width, schema32.height],
        // gridRes3: [schema32.size, schema32.size, schema32.size],

        tex3dInput0: null32.texture,
        tex3dInput1: null32.texture,
        tex3dInput2: null32.texture,

        tex3dIndex: schema32.texture,
        size: schema32.size,
        numRows: schema32.numRows,
        slicesPerRow: schema32.slicesPerRow,

        dT: 0.00167,
        eT: 0,
      },
    };

    // code id
    const Exec = {
      copy: 0.0,
      makeIndexTexture: 1.0,
      custom3DLookup: 2.0,
      makeGravity: 3.0,
      markerGrid: 4.0,
      addPosWithVel: 5.0,
    };

    let makeLookupTable = () => {
      // let size = 32;
      // let slicesPerRow = 32;
      // var numRows = Math.floor((size + slicesPerRow - 1) / slicesPerRow);
      // let lookupData = new Uint8Array(size * slicesPerRow * size * numRows * 4);

      // // var pixels = new Uint8Array(size * slicesPerRow * size * numRows * 4);
      // var pixelsAcross = slicesPerRow * size;
      // let max = Math.pow(2, 8);
      // console.log(max);

      // // let r0 = () => Math.random() * 2.0 - 1.0;
      // for (var slice = 0; slice < size; ++slice) {
      //   var row = Math.floor(slice / slicesPerRow);
      //   var xOff = (slice % slicesPerRow) * size;
      //   var yOff = row * size;
      //   for (var y = 0; y < size; ++y) {
      //     for (var x = 0; x < size; ++x) {
      //       var offset = ((yOff + y) * pixelsAcross + xOff + x) * 4;
      //       lookupData[offset + 0] = (x / size) * max;
      //       lookupData[offset + 1] = (y / size) * max;
      //       lookupData[offset + 2] = (slice / size) * max;
      //       lookupData[offset + 3] = max;
      //     }
      //   }
      // }
      // let varLookup2 = make2DTexture({
      //   name: "varLookup",
      //   width: 32 * 32,
      //   height: 32,
      //   data: lookupData,
      //   format: ctx.PixelFormat.RGBA8,
      // });

      // // // MAKE lookup
      ctx.submit(gpuIO, {
        // output to
        pass: varLookup.passWithClear,
        viewport: varLookup.viewport,

        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: schema32.texture,

          // code
          code: Exec.makeIndexTexture,
        },
      });
      gpuIO.uniforms.tex3dIndex = varLookup.texture;
    };

    let makeInitData = () => {
      // MAKE pos init
      ctx.submit(gpuIO, {
        // output
        pass: varPos.passWithClear,
        viewport: varPos.viewport,

        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varLookup.texture,

          // code
          code: Exec.copy,
        },
      });
    };

    let importToTemp = () => {
      ctx.submit(gpuIO, {
        // output
        pass: varPosTemp.passWithClear,
        viewport: varPosTemp.viewport,

        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varPos.texture,

          // code
          code: Exec.copy,
        },
      });

      ctx.submit(gpuIO, {
        // output
        pass: varVelTemp.passWithClear,
        viewport: varVelTemp.viewport,

        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varVel.texture,

          // code
          code: Exec.copy,
        },
      });
    };

    let exportFromTemp = () => {
      ctx.submit(gpuIO, {
        // output
        pass: varPos.passWithClear,
        viewport: varPos.viewport,

        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varPosTemp.texture,

          // code
          code: Exec.copy,
        },
      });

      ctx.submit(gpuIO, {
        // output
        pass: varVel.passWithClear,
        viewport: varVel.viewport,

        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varVelTemp.texture,

          // code
          code: Exec.copy,
        },
      });
    };

    let makeTimeRelatedVars = () => {
      // MAKE gravity
      ctx.submit(gpuIO, {
        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varLookup.texture,

          // code
          code: Exec.makeGravity,
        },

        // output
        pass: varGravity.passWithClear,
        viewport: varGravity.viewport,
      });
    };

    let simulateTemp = () => {
      ctx.submit(gpuIO, {
        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varPosTemp.texture,
          tex3dInput1: varGravity.texture,

          // code
          code: Exec.addPosWithVel,
        },

        // output
        pass: varTemp1.passWithClear,
        viewport: varTemp1.viewport,
      });

      ctx.submit(gpuIO, {
        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varTemp1.texture,

          // code
          code: Exec.copy,
        },

        // output
        pass: varPosTemp.passWithClear,
        viewport: varPosTemp.viewport,
      });

      ctx.submit(gpuIO, {
        uniforms: {
          dT: this.dT,
          eT: this.eT,

          // input
          tex3dInput0: varPosTemp.texture,

          // code
          code: Exec.markerGrid,
        },

        // output
        pass: varMarker.passWithClear,
        viewport: varMarker.viewport,
      });
    };

    // simulation and render loop

    // initialise data
    makeLookupTable();
    makeInitData();

    this.tick = 0;
    mini.onLoop(() => {
      ctx.submit(clearScreenCmd);

      makeTimeRelatedVars();

      importToTemp();

      simulateTemp();

      exportFromTemp();

      // debugTexture2D({ inputTexture: varPos.texture, slot: 2 });

      // debugTexture3Ds32({ inputTexture: varMarker.texture, slot: 0 });

      //

      debugTexture3Ds32({ inputTexture: varMarker.texture, slot: 0 });

      debugTexture3Ds32FullScreen({ inputTexture: varPos.texture });

      this.tick++;
    });
  }
}
