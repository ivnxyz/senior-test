declare module 'javascript-lp-solver' {
  export interface Model {
    optimize: string;
    opType: 'max' | 'min';
    constraints: Record<string, any>;
    variables: Record<string, any>;
    ints?: Record<string, number>;
  }

  export interface Solution {
    result?: number;
    feasible?: boolean;
    [key: string]: number | boolean | undefined;
  }

  function Solve(model: Model): Solution;

  export default { Solve };
} 