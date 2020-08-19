import Matter from 'matter-js';

// @snowpack - can't destructure directly on import commonjs
const { Composite, Body, Query } = Matter;

import type { EnhanceBody } from './@types';

export const selectBody = (body: EnhanceBody, selected: boolean) => {
  if (selected) {
    body.render.opacity = 0.5;
  } else {
    body.render.opacity = 1;
  }
};

export const processSnapPosition = (position: number, step: number | false) => {
  if (!step || step <= 0) {
    return position;
  }
  const rest = position % step;
  return position - rest + step / 2;
};

// @todo manage collisions
export const startMoveBody = (body: EnhanceBody, x: number, y: number) => {
  body.meta.previousPosition = {
    x,
    y,
  };
};

export const moveBody = (
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

export const getAllBodies = (world: Matter.World) => {
  const bodies = Composite.allBodies(world) as EnhanceBody[];
  return bodies.filter((body) => body.meta);
};

export function getRealPosition(
  e: MouseEvent,
  elem: HTMLCanvasElement,
  options?: {
    bounds: Matter.Bounds;
    originalSize: { width: number; height: number };
  },
) {
  const rect = elem.getBoundingClientRect();
  const realX = e.clientX - rect.left;
  const realY = e.clientY - rect.top;
  if (options) {
    const computedWidth = options.bounds.max.x - options.bounds.min.x;
    const computedHeight = options.bounds.max.y - options.bounds.min.y;
    return {
      x:
        (computedWidth / options.originalSize.width) * realX +
        options.bounds.min.x,
      y:
        (computedHeight / options.originalSize.height) * realY +
        options.bounds.min.y,
    };
  }
  return { x: realX, y: realY };
}

export const targetBody = (
  world: Matter.World,
  realPosition: { x: number; y: number },
) => {
  const bodies = getAllBodies(world);
  const clickedBodies = Query.point(bodies, realPosition) as EnhanceBody[];
  if (clickedBodies.length > 0) {
    return clickedBodies[0];
  }
  return null;
};
