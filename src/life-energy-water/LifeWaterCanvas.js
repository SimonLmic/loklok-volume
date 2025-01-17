import { useEffect, useRef } from "react";
import { Mini } from "../shared/Mini";
// import { VolumeControls } from "../shared/VolumeControls";
import { LifeWater } from "./LifeWater";

export const LifeWaterCanvas = () => {
  const ref = useRef(null);
  //
  useEffect(() => {
    let mini = new Mini({ name: "base", domElement: ref.current, window });
    let mods = [
      //
      new LifeWater(mini),
    ];

    mini.get("ctx").then((ctx) => {
      ctx.frame(() => {
        mini.work();
      });
    });

    let cleaner = () => {
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

  return (
    <div className="w-full h-full" ref={ref}>
      {/* <div className="absolute bottom-0 left-0 bg-white p-2 text-xs">
        <a
          href="https://www.linkedin.com/in/wonglok831/"
          target="blank"
          className="underline"
        >
          Pex Example
        </a>
      </div> */}
      <div className="absolute top-0 right-0 bg-white p-2 text-xs">
        <a
          href="https://www.linkedin.com/in/wonglok831/"
          target="blank"
          className="underline"
        >
          到樂樂 Linkedin 一遊
        </a>
      </div>
    </div>
  );
};

if (module.hot) {
  module.hot.dispose(() => {
    window.location.reload();
  });
}
