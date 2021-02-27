import "./App.css";
import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { VolumeCanvas } from "./volume/VolumeCanvas";
import { SlicerCanvas } from "./slicer/SlicerCanvas";
import { VoxelCanvas } from "./voxel/VoxelCanvas";
import { GPUCanvas } from "./gpu/GPUCanvas";
import { EnergyCanvas } from "./energy/EnergyCanvas";
import { BubbleCanvas } from "./bubble/BubbleCanvas";

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/about">
          <div>About</div>
        </Route>
        <Route exact path="/gpu">
          <GPUCanvas></GPUCanvas>
        </Route>
        <Route exact path="/energy">
          <EnergyCanvas></EnergyCanvas>
        </Route>
        <Route exact path="/slicer">
          <SlicerCanvas></SlicerCanvas>
        </Route>
        <Route exact path="/volume">
          <VolumeCanvas></VolumeCanvas>
        </Route>
        <Route exact path="/voxel">
          <VoxelCanvas></VoxelCanvas>
        </Route>
        <Route exact path="/bubble">
          <BubbleCanvas></BubbleCanvas>
        </Route>
        <Route exact path="/">
          <div className={"m-5"}>
            <Link to={"/volume"}>Volume</Link>
          </div>
          <div className={"m-5"}>
            <Link to={"/slicer"}>Slicer</Link>
          </div>
          <div className={"m-5"}>
            <Link to={"/voxel"}>Voxel</Link>
          </div>
          <div className={"m-5"}>
            <Link to={"/gpu"}>GPU</Link>
          </div>
          <div className={"m-5"}>
            <Link to={"/energy"}>Energy</Link>
          </div>
          <div className={"m-5"}>
            <Link to={"/bubble"}>Bubble</Link>
          </div>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
