import Matter from 'matter-js';

// @snowpack - can't destructure directly on import commonjs
const { Engine, World, Render } = Matter;

import type { GameModeType, BodyMetaInfos, EnhanceBody } from './@types';

import {
  getAllBodies,
  targetBody,
  getRealPosition,
  translateVector,
} from './view';

import { bodyGenerators, makeGround } from './build';

import {
  selectBody,
  processSnapPosition,
  startMoveBody,
  moveBody,
} from './move';

import { saveStateToStorage, loadStateFromStorage, makeState } from './state';

const SNAP_STEP = 20;

let gameMode: GameModeType = 'editortime';

let state: BodyMetaInfos[] = [];

const rootElm = document.querySelector<HTMLDivElement>('#root');
const saveButtonElm = document.querySelector<HTMLButtonElement>('#save');
const reloadButtonElm = document.querySelector<HTMLButtonElement>('#reload');
const editortimeElm = document.querySelector<HTMLButtonElement>(
  '#editortime-mode',
);
const runtimeElm = document.querySelector<HTMLButtonElement>('#runtime-mode');

console.log(rootElm);
// create an engine
var engine = Engine.create();

// create a renderer
var render = Render.create({
  element: rootElm!,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
  },
});

// track selected body
let selected: EnhanceBody | null = null;
let selectedViewport: boolean = false;

// track mouse position
let mousePosition = { x: 0, y: 0 };

function onKeyUp(e: KeyboardEvent) {
  type KeyFuncMapType = 'b' | 'c' | 'e' | 'r';
  const keyFuncMap: { [K in KeyFuncMapType]: () => void } = {
    b: () => {
      if (gameMode === 'runtime') {
        return;
      }
      const body = bodyGenerators.rectangle(
        'editortime',
        processSnapPosition(mousePosition.x, e.shiftKey ? SNAP_STEP : false),
        processSnapPosition(mousePosition.y, e.shiftKey ? SNAP_STEP : false),
      );
      // @todo only change current body
      World.add(engine.world, body);
      state = makeState(getAllBodies(engine.world));
    },
    c: () => {
      if (gameMode === 'runtime') {
        return;
      }
      const body = bodyGenerators.circle(
        'editortime',
        processSnapPosition(mousePosition.x, e.shiftKey ? SNAP_STEP : false),
        processSnapPosition(mousePosition.y, e.shiftKey ? SNAP_STEP : false),
      );
      // @todo only change current body
      World.add(engine.world, body);
      state = makeState(getAllBodies(engine.world));
    },
    e: () => initEditortime(state),
    r: () => initRuntime(state),
  };
  console.log(e);
  keyFuncMap[e.key.toLocaleLowerCase() as KeyFuncMapType] &&
    keyFuncMap[e.key.toLocaleLowerCase() as KeyFuncMapType]();
  console.log(state);
}

window.addEventListener('keyup', onKeyUp);

render.canvas.addEventListener('mousedown', (e) => {
  if (gameMode !== 'runtime') {
    selected = targetBody(
      engine.world,
      getRealPosition(e, render.canvas, {
        bounds: render.bounds,
        originalSize: {
          width: render.options.width!,
          height: render.options.height!,
        },
      }),
    );
  }
  if (selected) {
    selectBody(selected, true);
    startMoveBody(selected, selected.position.x, selected.position.y);
  } else {
    selectedViewport = true;
  }
  console.log('selected', selected);
});

render.canvas.addEventListener('mouseup', (e) => {
  console.log('selected', selected);
  console.log(state);
  if (selected) {
    selectBody(selected, false);
  }
  selected = null;
  selectedViewport = false;
  console.log('mouseup');
});

render.canvas.addEventListener('mousemove', (e) => {
  mousePosition = getRealPosition(e, render.canvas, {
    bounds: render.bounds,
    originalSize: {
      width: render.options.width!,
      height: render.options.height!,
    },
  });
  // move viewport
  if (selectedViewport) {
    let delta = translateVector(
      {
        x: -e.movementX,
        y: -e.movementY,
      },
      {
        bounds: render.bounds,
        originalSize: {
          width: render.options.width!,
          height: render.options.height!,
        },
      },
    );
    // @ts-ignore
    Render.lookAt(render, {
      bounds: {
        min: {
          x: render.bounds.min.x + delta.x,
          y: render.bounds.min.y + delta.y,
        },
        max: {
          x: render.bounds.max.x + delta.x,
          y: render.bounds.max.y + delta.y,
        },
      },
    });
  }
  // move selected body
  if (selected && gameMode !== 'runtime') {
    moveBody(
      selected,
      mousePosition.x,
      mousePosition.y,
      e.shiftKey ? SNAP_STEP : false,
    );
    // @todo only change current body
    state = makeState(getAllBodies(engine.world));
  }
});

function cleanupWorld() {
  World.clear(engine.world, false);
}

function manageMouseOver(gameMode: GameModeType) {
  console.log('manageMouseOver');
  if (rootElm) {
    if (gameMode === 'runtime') {
      rootElm.style.cursor = 'not-allowed';
      console.log(rootElm);
    } else {
      rootElm.style.cursor = 'default';
    }
    console.log('rootElm', rootElm);
  }
}

function setGameMode(mode: GameModeType) {
  gameMode = mode;
  if (saveButtonElm) {
    if (gameMode === 'runtime') {
      saveButtonElm.style.cursor = 'not-allowed';
      saveButtonElm.disabled = true;
    } else {
      saveButtonElm.style.cursor = 'default';
      saveButtonElm.disabled = false;
    }
  }
}

const init = (mode: GameModeType) => (stateCb: () => BodyMetaInfos[]) => {
  setGameMode(mode);
  manageMouseOver(gameMode);
  cleanupWorld();
  const ground = makeGround(window.innerWidth, window.innerHeight);
  // add all of the bodies to the world
  const bodies = stateCb().map((bodyInfo) => {
    return bodyGenerators[bodyInfo.type](
      mode,
      bodyInfo.initialPosition.x,
      bodyInfo.initialPosition.y,
    );
  });
  World.add(engine.world, [...ground, ...bodies]);
};

function initEditortime(state: BodyMetaInfos[]) {
  runtimeElm?.classList.remove('active');
  editortimeElm?.classList.add('active');
  init('editortime')(() => state);
}

function initRuntime(state: BodyMetaInfos[]) {
  editortimeElm?.classList.remove('active');
  runtimeElm?.classList.add('active');
  init('runtime')(() => state);
}

editortimeElm?.addEventListener('click', () => initEditortime(state), false);
runtimeElm?.addEventListener('click', () => initRuntime(state), false);

function save() {
  if (gameMode !== 'editortime') {
    return;
  }
  saveStateToStorage(state || []);
}

function reload() {
  state = loadStateFromStorage();
  if (gameMode === 'editortime') {
    initEditortime(state);
  } else {
    initRuntime(state);
  }
}

saveButtonElm?.addEventListener('click', save, false);
reloadButtonElm?.addEventListener('click', reload, false);

initEditortime(state);
// run the engine
Engine.run(engine);
// run the renderer
Render.run(render);

const ZOOM_VELOCITY = 0.23;

rootElm?.addEventListener('wheel', (e) => {
  // @ts-ignore
  Render.lookAt(render, {
    bounds: {
      min: {
        x: render.bounds.min.x - ZOOM_VELOCITY * e.deltaY,
        y: render.bounds.min.y - ZOOM_VELOCITY * e.deltaY,
      },
      max: {
        x: render.bounds.max.x + ZOOM_VELOCITY * e.deltaY,
        y: render.bounds.max.y + ZOOM_VELOCITY * e.deltaY,
      },
    },
  });
});
