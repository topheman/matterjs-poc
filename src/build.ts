import Matter from 'matter-js';

// @snowpack - can't destructure directly on import commonjs
const { Bodies } = Matter;

import type {
  ShapeType,
  GameModeType,
  BodyOptions,
  EnhanceBody,
} from './@types';

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

export const bodyGenerators = {
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

export const makeGround = (screenWidth: number, screenHeight: number) => {
  console.log({ screenWidth, screenHeight });
  const top = Bodies.rectangle(screenWidth / 2, 0, screenWidth, 5, {
    isStatic: true,
    render: { fillStyle: '#900000' },
  });
  const bottom = Bodies.rectangle(
    screenWidth / 2,
    screenHeight - 1,
    screenWidth,
    5,
    {
      isStatic: true,
      render: { fillStyle: '#900000' },
    },
  );
  const left = Bodies.rectangle(0, screenHeight / 2, 5, screenHeight, {
    isStatic: true,
    render: { fillStyle: '#900000' },
  });
  const right = Bodies.rectangle(
    screenWidth - 1,
    screenHeight / 2,
    5,
    screenHeight,
    {
      isStatic: true,
      render: { fillStyle: '#900000' },
    },
  );
  return [left, bottom, top, right];
};
