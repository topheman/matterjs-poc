import Matter from 'matter-js';

// @snowpack - can't destructure directly on import commonjs
const { Query, Composite } = Matter;

import type { EnhanceBody } from './@types';

type MatterCollision = {
  collided: boolean;
  bodyA: EnhanceBody;
  bodyB: EnhanceBody;
};

export const getAllBodies = (
  world: Matter.World,
  minusBodies: EnhanceBody[] = [],
) => {
  const bodies = Composite.allBodies(world) as EnhanceBody[];
  let result = bodies.filter((body) => body.meta);
  if (minusBodies.length > 0) {
    const minusBodiesId = minusBodies.map((body) => body.id);
    result = result.filter((body) => !minusBodiesId.includes(body.id));
  }
  return result;
};

export const collides = (body: EnhanceBody, world: Matter.World) => {
  const collisions = Query.collides(
    body,
    getAllBodies(world, [body]),
  ) as MatterCollision[];
  return collisions.map((collision) => {
    return collision.bodyA.id !== body.id ? collision.bodyA : collision.bodyB;
  });
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

export const safeViewportBounds = (
  delta: Matter.Bounds,
  originalBounds: Matter.Bounds,
  levelWidth: number,
  levelHeight: number,
) => {
  const left = originalBounds.min.x + delta.min.x < 0;
  const top = originalBounds.min.y + delta.min.y < 0;
  const right = originalBounds.max.x + delta.max.x > levelWidth;
  const bottom = originalBounds.max.y + delta.max.y > levelHeight;
  // return same bounds if we are in a corner
  if (
    (left && top) ||
    (top && right) ||
    (right && bottom) ||
    (bottom && left)
  ) {
    return originalBounds;
  }
  // add delta
  const result = {
    min: {
      x: left && !right ? 0 : originalBounds.min.x + delta.min.x,
      y: top && !bottom ? 0 : originalBounds.min.y + delta.min.y,
    },
    max: {
      x: right && !left ? levelWidth : originalBounds.max.x + delta.max.x,
      y: bottom && !top ? levelHeight : originalBounds.max.y + delta.max.y,
    },
  };
  // console.log(result);
  return result;
};

type WidthHeightType = { width: number; height: number };

export const zoomedOutViewportBounds = (
  level: WidthHeightType,
  viewport: WidthHeightType,
): Matter.Bounds => {
  console.log(
    'width',
    level.width,
    viewport.width,
    'height',
    level.height,
    viewport.height,
  );
  const levelRatio = level.width / level.height;
  const viewportRatio = viewport.width / viewport.height;
  const result: Matter.Bounds = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  if (levelRatio >= viewportRatio) {
    result.min.x = 0;
    result.max.x = level.width;
    const rest = (level.height - viewport.height) / 2;
    result.min.y = -rest;
    result.max.y = rest + level.height;
  } else {
    result.min.y = 0;
    result.max.y = level.height;
    const rest = (level.width - viewport.width) / 2;
    result.min.x = -rest;
    result.max.x = rest + level.width;
  }
  console.log(result);
  return result;
};
