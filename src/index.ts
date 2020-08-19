import {
  Engine,
  World,
  Render,
  Bodies,
  Query,
  Composite,
  Body,
  IChamferableBodyDefinition,
} from 'matter-js';

// @todo abstract this part + dont forget to cleanup DOM + requestAnimationFrame

type GameModeType = 'runtime' | 'editortime';

type ShapeType = 'rectangle' | 'circle';

type BodyOptions = IChamferableBodyDefinition;

type BodyMetaInfos = {
  type: ShapeType;
  constructorParams: number[];
  initialPosition: { x: number; y: number }; // position to be serialized
  previousPosition: { x: number; y: number }; // keep track of original position for drag and drop
};

interface EnhanceBody extends Body {
  meta: BodyMetaInfos;
}

const SNAP_STEP = 20;

const STORAGE_KEY = 'MATTER_JS_BASIC_EDITOR_2';

let gameMode: GameModeType = 'editortime';

let state: BodyMetaInfos[] = [];

const bodyFactory = (shapeType: ShapeType) => (...rest: number[]) => (
  x: number,
  y: number,
  bodyOptions: BodyOptions,
): EnhanceBody => {
  // @ts-ignore
  const body = Bodies[shapeType](x, y, ...rest, bodyOptions) as EnhanceBody;
  // will be serialized
  body.meta = {
    type: shapeType,
    initialPosition: {
      x,
      y,
    },
    constructorParams: [...rest],
    previousPosition: {
      x,
      y,
    },
  };
  return body;
};

const bodyGenerators = {
  rectangle: (mode: GameModeType, x: number, y: number) =>
    bodyFactory('rectangle')(40, 40)(x, y, {
      isStatic: true,
      render: { fillStyle: '#900000' },
    }),
  circle: (mode: GameModeType, x: number, y: number) =>
    bodyFactory('circle')(20)(x, y, {
      isStatic: mode === 'editortime' ? true : false,
      restitution: 0.9,
      render: { fillStyle: '#900000' },
    }),
};

const selectBody = (body: EnhanceBody, selected: boolean) => {
  if (selected) {
    body.render.opacity = 0.5;
  } else {
    body.render.opacity = 1;
  }
};

const processSnapPosition = (position: number, step: number) => {
  const rest = position % step;
  return position - rest + step / 2;
};

// @todo manage collisions
const startMoveBody = (body: EnhanceBody, x: number, y: number) => {
  body.meta.previousPosition = {
    x,
    y,
  };
};

const moveBody = (
  body: EnhanceBody,
  x: number,
  y: number,
  snapStep: number | false,
) => {
  const newX = snapStep ? processSnapPosition(x, snapStep) : x;
  const newY = snapStep ? processSnapPosition(y, snapStep) : y;
  Body.setPosition(body, {
    x: newX,
    y: newY,
  });
  body.meta.initialPosition = {
    x: newX,
    y: newY,
  };
  // note for futur : return state to take in account
};

const getAllBodies = (world: World) => {
  const bodies = Composite.allBodies(world) as EnhanceBody[];
  return bodies.filter((body) => body.meta);
};

const saveStateToStorage = (state: BodyMetaInfos[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Couldn't save state to storage", e.message);
  }
};

const loadStateFromStorage = (): BodyMetaInfos[] => {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) as string,
    ) as BodyMetaInfos[];
  } catch (e) {
    console.error("Couldn't load state from storage", e.message);
  }
  return [];
};

const makeState = (bodies: EnhanceBody[]): BodyMetaInfos[] => {
  return bodies.map((body) => {
    return {
      ...body.meta,
      position: body.position,
    };
  });
};

function getRealPosition(e: MouseEvent, elem: HTMLCanvasElement) {
  const rect = elem.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return { x, y };
}

const canvasElm = document.querySelector<HTMLCanvasElement>('#root');
const saveButtonElm = document.querySelector<HTMLButtonElement>('#save');
const reloadButtonElm = document.querySelector<HTMLButtonElement>('#reload');

console.log(canvasElm);
// create an engine
var engine = Engine.create();

// create a renderer
var render = Render.create({
  element: canvasElm!,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: 600,
    wireframes: false,
  },
});

// track selected body
let selected: EnhanceBody | null = null;

// track mouse position
let mousePosition = { x: 0, y: 0 };

function onKeyUp(e: KeyboardEvent) {
  type KeyFuncMapType = 'b' | 'c' | 'e' | 'r';
  const keyFuncMap: { [K in KeyFuncMapType]: () => void } = {
    b: () => {
      const body = bodyGenerators.rectangle(
        'editortime',
        processSnapPosition(mousePosition.x, SNAP_STEP),
        processSnapPosition(mousePosition.y, SNAP_STEP),
      );
      // @todo only change current body
      World.add(engine.world, body);
      state = makeState(getAllBodies(engine.world));
    },
    c: () => {
      const body = bodyGenerators.circle(
        'editortime',
        processSnapPosition(mousePosition.x, SNAP_STEP),
        processSnapPosition(mousePosition.y, SNAP_STEP),
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
  if (gameMode === 'runtime') {
    return;
  }
  const bodies = getAllBodies(engine.world);
  const clickedBodies = Query.point(
    bodies,
    getRealPosition(e, render.canvas),
  ) as EnhanceBody[];
  if (clickedBodies.length) {
    selected = clickedBodies[0];
    selectBody(selected, true);
    startMoveBody(selected, selected.position.x, selected.position.y);
  }
  console.log('selected', selected);
});

render.canvas.addEventListener('mouseup', (e) => {
  if (gameMode === 'runtime') {
    return;
  }
  console.log('selected', selected);
  if (selected) {
    selectBody(selected, false);
  }
  selected = null;
  console.log('mouseup');
});

render.canvas.addEventListener('mousemove', (e) => {
  if (gameMode === 'runtime') {
    return;
  }
  mousePosition = getRealPosition(e, render.canvas);
  if (selected) {
    moveBody(
      selected,
      mousePosition.x,
      mousePosition.y,
      e.shiftKey ? SNAP_STEP : false,
    );
    // @todo only change current body
    state = makeState(getAllBodies(engine.world));
    console.log(state);
  }
});

function cleanupWorld() {
  World.clear(engine.world, false);
}

function manageMouseOver(gameMode: GameModeType) {
  console.log('manageMouseOver');
  if (canvasElm) {
    if (gameMode === 'runtime') {
      canvasElm.style.cursor = 'not-allowed';
      console.log(canvasElm);
    } else {
      canvasElm.style.cursor = 'default';
    }
    console.log('canvasElm', canvasElm);
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
  var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
  // add all of the bodies to the world
  const bodies = stateCb().map((bodyInfo) => {
    return bodyGenerators[bodyInfo.type](
      mode,
      bodyInfo.initialPosition.x,
      bodyInfo.initialPosition.y,
    );
  });

  // @todo
  World.add(engine.world, [ground, ...bodies]);
};

function initEditortime(state: BodyMetaInfos[]) {
  init('editortime')(() => state);
}

function initRuntime(state: BodyMetaInfos[]) {
  init('runtime')(() => state);
}

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
