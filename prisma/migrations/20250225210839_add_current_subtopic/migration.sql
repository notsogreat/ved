-- AlterEnum
ALTER TYPE "Difficulty" ADD VALUE 'beginner';

-- AlterTable
ALTER TABLE "user_progress" ADD COLUMN     "current_subtopic_id" TEXT;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_current_subtopic_id_fkey" FOREIGN KEY ("current_subtopic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
