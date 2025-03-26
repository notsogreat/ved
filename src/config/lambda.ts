export interface LambdaConfig {
  functionNames: {
    [key: string]: string;
  };
}

const lambdaConfig: LambdaConfig = {
  functionNames: {
    go: 'Test1',      // Go Lambda function name
    python: 'pythonRun'  // Python Lambda function name
  },
};

export default lambdaConfig; 