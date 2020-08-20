import Matter from 'matter-js';

// @snowpack - can't destructure directly on import commonjs
const { Query, Composite } = Matter;

import type { EnhanceBody } from './@types';

export const getAllBodies = (world: Matter.World) => {
  const bodies = Composite.allBodies(world) as EnhanceBody[];
  return bodies.filter((body) => body.meta);
};

type TranslateVectorOptions = {
  bounds: Matter.Bounds;
  originalSize: { width: number; height: number };
};

export const translateCoordinates = (
  vector: { x: number; y: number },
  options: TranslateVectorOptions,
) => {
  return translateVector(vector, options, true);
};

export const translateVector = (
  vector: { x: number; y: number },
  options: TranslateVectorOptions,
  isCoordinates: boolean = false,
) => {
  const computedWidth = options.bounds.max.x - options.bounds.min.x;
  const computedHeight = options.bounds.max.y - options.bounds.min.y;
  return {
    x:
      (computedWidth / options.originalSize.width) * vector.x +
      (isCoordinates ? options.bounds.min.x : 0),
    y:
      (computedHeight / options.originalSize.height) * vector.y +
      (isCoordinates ? options.bounds.min.y : 0),
  };
};

export function getRealPosition(
  e: MouseEvent,
  elem: HTMLCanvasElement,
  options?: TranslateVectorOptions,
) {
  const rect = elem.getBoundingClientRect();
  const realX = e.clientX - rect.left;
  const realY = e.clientY - rect.top;
  if (options) {
    return translateCoordinates({ x: realX, y: realY }, options);
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
