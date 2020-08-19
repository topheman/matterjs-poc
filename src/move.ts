import Matter from 'matter-js';

// @snowpack - can't destructure directly on import commonjs
const { Composite, Body } = Matter;

import type { EnhanceBody } from './@types';

export const selectBody = (body: EnhanceBody, selected: boolean) => {
  if (selected) {
    body.render.opacity = 0.5;
  } else {
    body.render.opacity = 1;
  }
};

export const processSnapPosition = (position: number, step: number) => {
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

export function getRealPosition(e: MouseEvent, elem: HTMLCanvasElement) {
  const rect = elem.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return { x, y };
}
