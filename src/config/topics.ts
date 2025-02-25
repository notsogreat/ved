export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard';

export interface Topic {
  name: string;
  difficulty: Difficulty;
  prerequisites: string[];
  subtopics?: Topic[];
}

export const DataStructureTopics: Topic[] = [
  {
    name: "Arrays & Strings",
    difficulty: "easy",
    prerequisites: [],
    subtopics: [
      { name: "Basic Array Operations", difficulty: "beginner", prerequisites: [] },
      { name: "String Manipulation", difficulty: "easy", prerequisites: ["Basic Array Operations"] },
      { name: "2D Arrays/Matrices", difficulty: "medium", prerequisites: ["Basic Array Operations"] }
    ]
  },
  {
    name: "HashMaps & Sets",
    difficulty: "easy",
    prerequisites: ["Arrays & Strings"],
    subtopics: [
      { name: "Hash Functions", difficulty: "easy", prerequisites: [] },
      { name: "Collision Handling", difficulty: "medium", prerequisites: ["Hash Functions"] }
    ]
  },
  {
    name: "Linked Lists",
    difficulty: "medium",
    prerequisites: ["Arrays & Strings"],
    subtopics: [
      { name: "Singly Linked Lists", difficulty: "easy", prerequisites: [] },
      { name: "Doubly Linked Lists", difficulty: "medium", prerequisites: ["Singly Linked Lists"] }
    ]
  },
  {
    name: "Stacks & Queues",
    difficulty: "medium",
    prerequisites: ["Linked Lists"],
    subtopics: [
      { name: "Stack Implementation", difficulty: "easy", prerequisites: [] },
      { name: "Queue Implementation", difficulty: "easy", prerequisites: [] },
      { name: "Priority Queues", difficulty: "medium", prerequisites: ["Queue Implementation"] }
    ]
  },
  {
    name: "Trees",
    difficulty: "medium",
    prerequisites: ["Stacks & Queues"],
    subtopics: [
      { name: "Binary Trees", difficulty: "medium", prerequisites: [] },
      { name: "BST", difficulty: "medium", prerequisites: ["Binary Trees"] },
      { name: "AVL Trees", difficulty: "hard", prerequisites: ["BST"] }
    ]
  },
  {
    name: "Graphs",
    difficulty: "hard",
    prerequisites: ["Trees"],
    subtopics: [
      { name: "Graph Representation", difficulty: "medium", prerequisites: [] },
      { name: "Graph Traversal", difficulty: "hard", prerequisites: ["Graph Representation"] },
      { name: "Shortest Path Algorithms", difficulty: "hard", prerequisites: ["Graph Traversal"] }
    ]
  }
];

export const AlgorithmsTopics: Topic[] = [
  {
    name: "Sorting",
    difficulty: "medium",
    prerequisites: ["Arrays & Strings"],
    subtopics: [
      { name: "Bubble Sort", difficulty: "easy", prerequisites: [] },
      { name: "Quick Sort", difficulty: "medium", prerequisites: ["Bubble Sort"] },
      { name: "Merge Sort", difficulty: "medium", prerequisites: ["Bubble Sort"] }
    ]
  },
  {
    name: "Searching",
    difficulty: "medium",
    prerequisites: ["Sorting"],
    subtopics: [
      { name: "Linear Search", difficulty: "easy", prerequisites: [] },
      { name: "Binary Search", difficulty: "medium", prerequisites: ["Linear Search"] }
    ]
  },
  {
    name: "Dynamic Programming",
    difficulty: "hard",
    prerequisites: ["Recursion"],
    subtopics: [
      { name: "Memoization", difficulty: "medium", prerequisites: [] },
      { name: "Tabulation", difficulty: "hard", prerequisites: ["Memoization"] }
    ]
  }
];

export const SystemDesignTopics: Topic[] = [
  {
    name: "Basics",
    difficulty: "medium",
    prerequisites: [],
    subtopics: [
      { name: "Client-Server Model", difficulty: "easy", prerequisites: [] },
      { name: "Network Protocols", difficulty: "medium", prerequisites: ["Client-Server Model"] }
    ]
  },
  {
    name: "Scalability",
    difficulty: "hard",
    prerequisites: ["Basics"],
    subtopics: [
      { name: "Vertical Scaling", difficulty: "medium", prerequisites: [] },
      { name: "Horizontal Scaling", difficulty: "hard", prerequisites: ["Vertical Scaling"] },
      { name: "Load Balancing", difficulty: "hard", prerequisites: ["Horizontal Scaling"] }
    ]
  },
  {
    name: "Databases",
    difficulty: "hard",
    prerequisites: ["Scalability"],
    subtopics: [
      { name: "SQL vs NoSQL", difficulty: "medium", prerequisites: [] },
      { name: "Database Sharding", difficulty: "hard", prerequisites: ["SQL vs NoSQL"] },
      { name: "Replication", difficulty: "hard", prerequisites: ["Database Sharding"] }
    ]
  }
];

export const WebDevelopmentTopics: Topic[] = [
  {
    name: "Frontend Basics",
    difficulty: "easy",
    prerequisites: [],
    subtopics: [
      { name: "HTML", difficulty: "beginner", prerequisites: [] },
      { name: "CSS", difficulty: "easy", prerequisites: ["HTML"] },
      { name: "JavaScript Basics", difficulty: "easy", prerequisites: ["HTML"] }
    ]
  },
  {
    name: "Frontend Frameworks",
    difficulty: "medium",
    prerequisites: ["Frontend Basics"],
    subtopics: [
      { name: "React Fundamentals", difficulty: "medium", prerequisites: ["JavaScript Basics"] },
      { name: "State Management", difficulty: "hard", prerequisites: ["React Fundamentals"] },
      { name: "Next.js", difficulty: "hard", prerequisites: ["React Fundamentals"] }
    ]
  },
  {
    name: "Backend Development",
    difficulty: "hard",
    prerequisites: ["Frontend Basics"],
    subtopics: [
      { name: "Node.js Basics", difficulty: "medium", prerequisites: [] },
      { name: "Express.js", difficulty: "medium", prerequisites: ["Node.js Basics"] },
      { name: "API Design", difficulty: "hard", prerequisites: ["Express.js"] }
    ]
  }
];

export const AllTopics = {
  "Data Structures": DataStructureTopics,
  "Algorithms": AlgorithmsTopics,
  "System Design": SystemDesignTopics,
  "Web Development": WebDevelopmentTopics
};

export const topics = [
  {
    id: "data-structures",
    title: "Data Structures",
    description: "Master fundamental data structures like arrays, linked lists, trees, and graphs.",
    lessonCount: DataStructureTopics.length + DataStructureTopics.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0),
  },
  {
    id: "algorithms",
    title: "Algorithms",
    description: "Learn essential algorithms and problem-solving techniques.",
    lessonCount: AlgorithmsTopics.length + AlgorithmsTopics.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0),
  },
  {
    id: "system-design",
    title: "System Design",
    description: "Understand how to design scalable and efficient systems.",
    lessonCount: SystemDesignTopics.length + SystemDesignTopics.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0),
  },
  {
    id: "web-development",
    title: "Web Development",
    description: "Build modern, responsive web applications using React and Node.js.",
    lessonCount: WebDevelopmentTopics.length + WebDevelopmentTopics.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0),
  }
] as const;

export type TopicId = typeof topics[number]['id']; 