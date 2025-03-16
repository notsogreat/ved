/*
  Warnings:

  - You are about to drop the `question_examples` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_cases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `topics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_submissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "question_examples" DROP CONSTRAINT "question_examples_question_id_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_question_id_fkey";

-- DropForeignKey
ALTER TABLE "topics" DROP CONSTRAINT "topics_parentId_fkey";

-- DropForeignKey
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_current_subtopic_id_fkey";

-- DropForeignKey
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_submissions" DROP CONSTRAINT "user_submissions_question_id_fkey";

-- DropForeignKey
ALTER TABLE "user_submissions" DROP CONSTRAINT "user_submissions_user_id_fkey";

-- DropTable
DROP TABLE "question_examples";

-- DropTable
DROP TABLE "questions";

-- DropTable
DROP TABLE "test_cases";

-- DropTable
DROP TABLE "topics";

-- DropTable
DROP TABLE "user_progress";

-- DropTable
DROP TABLE "user_submissions";

-- DropEnum
DROP TYPE "Difficulty";

-- DropEnum
DROP TYPE "Status";

-- DropEnum
DROP TYPE "SubmissionStatus";
