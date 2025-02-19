export const topics = [
  {
    id: "data-structures",
    title: "Data Structures",
    description: "Master fundamental data structures like arrays, linked lists, trees, and graphs.",
    lessonCount: 12,
  },
  {
    id: "algorithms",
    title: "Algorithms",
    description: "Learn essential algorithms and problem-solving techniques.",
    lessonCount: 15,
  },
  {
    id: "system-design",
    title: "System Design",
    description: "Understand how to design scalable and efficient systems.",
    lessonCount: 8,
  },
] as const

export type TopicId = typeof topics[number]['id'] 