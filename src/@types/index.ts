import type Matter from 'matter-js';

export type BodyOptions = Matter.IChamferableBodyDefinition;

export type ShapeType = 'rectangle' | 'circle';

export type GameModeType = 'runtime' | 'editortime';

export type BodyMetaInfos = {
  type: ShapeType;
  constructorParams: number[];
  initialPosition: { x: number; y: number }; // position to be serialized
  previousPosition: { x: number; y: number }; // keep track of original position for drag and drop
};

export interface EnhanceBody extends Matter.Body {
  meta: BodyMetaInfos;
}
