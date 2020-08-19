import Matter from 'matter-js';

// @snowpack - can't destructure directly on import commonjs
const { Bodies } = Matter;

import type {
  ShapeType,
  GameModeType,
  BodyOptions,
  EnhanceBody,
} from './@types/index';

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
