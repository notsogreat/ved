export const generateQuestionPrompt = (topic: string, difficulty: string) => {
  return `Generate a coding problem related to ${topic} with ${difficulty} difficulty level. 
  The response should be in the following JSON format:
  {
    "title": "Problem title",
    "description": "Detailed problem description",
    "examples": [
      {
        "input": "Example input",
        "output": "Example output",
        "explanation": "Explanation of the example"
      }
    ],
    "constraints": ["List of constraints"],
    "testCases": [
      {
        "input": "Test case input",
        "output": "Expected output"
      }
    ]
  }`;
};

export const generateHintPrompt = (question: string) => {
  return `Generate a helpful hint for the following coding problem without giving away the complete solution:
  
  Problem: ${question}
  
  Provide a hint that guides the user towards the solution while encouraging them to think through the problem.`;
}; 