import type { BodyMetaInfos, EnhanceBody } from './@types';

const STORAGE_KEY = 'MATTER_JS_BASIC_EDITOR';

export const saveStateToStorage = (state: BodyMetaInfos[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Couldn't save state to storage", e.message);
  }
};

export const loadStateFromStorage = (): BodyMetaInfos[] => {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) as string,
    ) as BodyMetaInfos[];
  } catch (e) {
    console.error("Couldn't load state from storage", e.message);
  }
  return [];
};

export const makeState = (bodies: EnhanceBody[]): BodyMetaInfos[] => {
  return bodies.map((body) => {
    return {
      ...body.meta,
      position: body.position,
    };
  });
};
