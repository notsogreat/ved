import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Example {
  input: string;
  output: string;
  explanation: string;
}

interface TestCase {
  input: string;
  output: string;
}

interface Problem {
  title: string;
  description: string;
  examples: Example[];
  constraints: string[];
  testCases: TestCase[];
}

export default function ProblemDisplay() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(false);

  const generateProblem = async (topic: string, difficulty: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, difficulty }),
      });
      
      const data = await response.json();
      setProblem(data);
    } catch (error) {
      console.error('Error fetching problem:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button 
          onClick={() => generateProblem('algorithms', 'easy')}
          disabled={loading}
        >
          Generate Easy Problem
        </Button>
        <Button 
          onClick={() => generateProblem('algorithms', 'medium')}
          disabled={loading}
        >
          Generate Medium Problem
        </Button>
        <Button 
          onClick={() => generateProblem('algorithms', 'hard')}
          disabled={loading}
        >
          Generate Hard Problem
        </Button>
      </div>

      {loading && <div className="text-foreground">Generating problem...</div>}

      {problem && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">{problem.title}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Problem Description</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{problem.description}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Examples</h3>
              {problem.examples.map((example, index) => (
                <div key={index} className="mb-4 p-4 bg-muted rounded-lg">
                  <p className="text-foreground"><strong>Input:</strong> {example.input}</p>
                  <p className="text-foreground"><strong>Output:</strong> {example.output}</p>
                  <p className="text-foreground"><strong>Explanation:</strong> {example.explanation}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Constraints</h3>
              <ul className="list-disc pl-6 text-muted-foreground">
                {problem.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 