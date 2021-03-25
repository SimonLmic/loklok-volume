import { useEffect, useRef } from "react";
import { Mini } from "../shared/Mini";
import { Base } from "../shared/Base";
import { LineStuff } from "./LineStuff";
import { SceneControls } from "../shared/SceneControls";
import { Vector3 } from "three";

//
// import { SceneControls } from "../shared/SceneControls";

export const LinesCanvas = () => {
  const ref = useRef(null);
  //
  useEffect(() => {
    let mini = new Mini({ name: "base", domElement: ref.current, window });
    let mods = [
      //
      new Base(mini),
      new LineStuff(mini, {
        delay: 0.0 * 1000.0,
        shape: "torus",
        position: new Vector3(-7.0, 0.0, 0.0),
      }),
      new LineStuff(mini, {
        //,
        delay: 0.25 * 1000.0,
        shape: "sphere",
        position: new Vector3(0.0, 0.0, 0.0),
      }),
      new LineStuff(mini, {
        //
        delay: 0.5 * 1000.0,
        shape: "box",
        position: new Vector3(7.0, 0.0, 0.0),
      }),
      new SceneControls(mini),
    ];

    //, new SceneControls(mini)

    let rAFID = 0;

    let workDisplay = () => {};
    Promise.all([
      mini.get("renderer"),
      mini.get("camera"),
      mini.get("scene"),
    ]).then(
      ([
        //
        renderer,
        camera,
        scene,
      ]) => {
        camera.position.z = 15;
        renderer.autoClear = false;
        workDisplay = () => {
          renderer.clear();
          renderer.render(scene, camera);
        };
      }
    );

    let rAF = () => {
      rAFID = requestAnimationFrame(rAF);
      workDisplay();
      mini.work();
    };
    rAFID = requestAnimationFrame(rAF);

    let cleaner = () => {
      cancelAnimationFrame(rAFID);
      mini.clean();
      mods.forEach((m) => {
        if (m.clean) {
          m.clean();
        }
      });
    };

    if (module.hot) {
      module.hot.dispose(() => {
        cleaner();
      });
    }

    return cleaner;
  }, []);

  return <div className="w-full h-full" ref={ref}></div>;
};

if (module.hot) {
  module.hot.dispose(() => {
    window.location.reload();
  });
}