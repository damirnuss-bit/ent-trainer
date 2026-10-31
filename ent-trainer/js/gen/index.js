// Реестр генераторов по предметам.
import { templates as math1 } from './math.js';
import { templates as math2 } from './math2.js';
import { templates as mathlit1 } from './mathlit.js';
import { templates as mathlit2 } from './mathlit2.js';
import { templates as physics } from './physics.js';
import { templates as chem, geneticsTemplates } from './chemistry.js';

export const GENERATORS = {
  mathlit: [...mathlit1, ...mathlit2],
  math: [...math1, ...math2],
  physics,
  chemistry: chem,
  biology: geneticsTemplates,
};

export const ALL_TEMPLATES = Object.values(GENERATORS).flat();
