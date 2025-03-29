import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Message } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { generateInitialScores } from '@/lib/utils/scoring';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define types for our messages
type Role = 'user' | 'assistant' | 'system';
type ChatMessage = {
  role: Role;
  content: string;
};

const systemPrompt = `
You are Ved AI's problem generator, specialized in creating high-quality programming interview questions and helping software engineers prepare for technical interviews. 
Your role is to generate clear, well-structured programming problems that test important concepts.

For any question that is not related to interview preparation, respond with: "Sorry, my capabilities are only for helping in interview preparation."

PROBLEM GENERATION WORKFLOW:

1. For new users or when starting, ALWAYS gather the following information if not already provided:
   - Target job title (Software Engineer, Senior Software Engineer, etc.) - THIS IS REQUIRED
   - Target companies (Big Tech, startups, etc.)
   - Preferred programming languages (Python, Go, Java, etc.)
   - Preparation timeframe (e.g., 4 weeks, 8 weeks)
   - Current skill level (beginner, intermediate, advanced)
   - Specific topic/concept (if specified)

If the user hasn't provided their target job title, ALWAYS ask for it first before proceeding with any other response.
Example response for missing job title:
"To provide you with the most relevant interview questions, could you please let me know what job title you're targeting? (e.g., Software Engineer, Senior Software Engineer, Lead Software Engineer, etc.)"

IMPORTANT: As soon as you identify a job title from the user, call the storeUserPerformanceScores tool with the job title ONLY ONCE. Do not call it again for the same job title later in the conversation. This is critical for tracking user progress.

2. Once you have the job title, Generate Problem with this structure:
   [ALWAYS START WITH 2 LINES EXPLAINING WHY THIS SPECIFIC PROBLEM WAS CHOSEN AND HOW IT WILL HELP THE USER IMPROVE]
   
   Problem Title: A clear, concise title
   
   Description: Clear explanation of the problem
   
   Example:
   Input: [format and example]
   Output: [expected result]
   Explanation: Why this is the output
   
   Constraints:
   - Time Complexity requirement
   - Space Complexity requirement
   - Input size limits
   - Value ranges

   Test Cases:
   [Generate exactly 3 test cases with increasing complexity. Format as follows:]
   
   Test Case 1:
   Input: [specific input values]
   Expected Output: [exact expected output]
   
   Test Case 2:
   Input: [specific input values]
   Expected Output: [exact expected output]
   
   Test Case 3:
   Input: [specific input values]
   Expected Output: [exact expected output]

   Note: Your solution must pass all three test cases to be considered correct.

IMPORTANT GUIDELINES:
1. Problem Characteristics:
   - Real-world applicable
   - Tests fundamental concepts
   - Clear and unambiguous
   - Gradually increasing complexity
   - Opportunity for optimization

2. Writing Style:
   - Professional and precise language
   - Consistent formatting
   - No ambiguous statements
   - Well-structured examples
   - Clear constraints

3. Focus Areas:
   If areas needing improvement are provided, generate problems that specifically target these areas.
   For example:
   - If "optimization" needs improvement, focus on problems requiring efficient solutions
   - If "edge cases" needs improvement, include problems with tricky edge cases
   - If "communication" needs improvement, require detailed explanation of approach

Remember: Focus only on generating the problem. Do not provide solutions or implementation hints unless specifically requested.
`

export async function POST(req: Request) {
  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const user = cookieStore.get('user')
    if (!user?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Tracking variable to prevent multiple tool calls for the same session
    let hasStoredScores = false;
    
    // Sanitize the user ID from the cookie to ensure it's a valid UUID
    // The cookie might contain a JSON object instead of just the UUID
    let userId: string;
    try {
      // Check if the value is a JSON object
      const parsedValue = JSON.parse(user.value);
      // Extract the ID from the parsed object
      if (parsedValue && typeof parsedValue === 'object' && parsedValue.id) {
        userId = parsedValue.id;
      } else {
        // If we can't get an ID from the parsed object, use the original value
        userId = user.value;
      }
    } catch (e) {
      // If it's not valid JSON, assume it's already a UUID string
      userId = user.value;
    }
    
    // Remove any quotes that might be wrapping the UUID
    userId = userId.replace(/^["'](.*)["']$/, '$1');
    
    // Validate the UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error(`Invalid userId format from cookie: ${user.value}`);
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    
    const { message, conversationHistory = [], conversationId } = await req.json()

    // Simplified logging - only log essential information
    console.log(`Processing message for conversation: ${conversationId || 'new conversation'}`);
    
    // Validate conversationId format if it exists
    if (conversationId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
      console.error(`Invalid conversationId format from request: ${conversationId}`);
      return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
    }
    
    // Check if this session already has stored scores to prevent redundant tool calls
    if (conversationId) {
      try {
        const existingScores = await prisma.user_performance_scores.findFirst({
          where: {
            user_id: userId,
            session_id: conversationId
          }
        });
        
        if (existingScores) {
          console.log(`Session ${conversationId} already has performance scores - setting flag to prevent tool calls`);
          hasStoredScores = true;
        }
      } catch (error) {
        console.error('Error checking for existing scores:', error);
        // Continue even if this check fails - tool handler will check again
      }
    }
    
    // Modify system prompt to prevent tool calls if we already have scores
    let effectiveSystemPrompt = systemPrompt;
    if (hasStoredScores) {
      // Replace the instruction to call the store tool with a note that scores already exist
      effectiveSystemPrompt = systemPrompt.replace(
        "IMPORTANT: As soon as you identify a job title from the user, call the storeUserPerformanceScores tool with the job title ONLY ONCE. Do not call it again for the same job title later in the conversation. This is critical for tracking user progress.",
        "IMPORTANT NOTICE: Performance scores have already been stored for this user. DO NOT attempt to store scores again or ask for job title again. Focus directly on generating appropriate programming problems."
      );
      
      // Also modify the first instruction to remove emphasis on asking for job title
      effectiveSystemPrompt = effectiveSystemPrompt.replace(
        "1. For new users or when starting, ALWAYS gather the following information if not already provided:\n   - Target job title (Software Engineer, Senior Software Engineer, etc.) - THIS IS REQUIRED",
        "1. The user's job title has already been recorded. You may still gather additional information if not already provided:"
      );
      
      // Also remove the part asking specifically for job title
      effectiveSystemPrompt = effectiveSystemPrompt.replace(
        "If the user hasn't provided their target job title, ALWAYS ask for it first before proceeding with any other response.\nExample response for missing job title:\n\"To provide you with the most relevant interview questions, could you please let me know what job title you're targeting? (e.g., Software Engineer, Senior Software Engineer, Lead Software Engineer, etc.)\"",
        "Focus on delivering appropriate programming problems for the user's job title which has already been recorded."
      );
    } else {
      // Add a guidance note to ensure the AI continues its response after calling the tool
      effectiveSystemPrompt += "\n\nVERY IMPORTANT: After calling the storeUserPerformanceScores tool, you MUST continue with your response. Do not wait for further user input. Immediately proceed to generate an appropriate programming problem for the user.";
    }
    
    // Create properly formatted messages for AI SDK
    const formattedMessages: ChatMessage[] = [
      { role: "system", content: effectiveSystemPrompt }
    ];
    
    // Add conversation history
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // Map and validate each message
      conversationHistory.forEach((msg: any) => {
        if (msg && msg.role && msg.content && 
            (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')) {
          formattedMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Add the user's message
    if (message) {
      formattedMessages.push({ role: "user", content: message });
    }

    // Test database connection but don't block on failure
    try {
      await prisma.$connect();
    } catch (dbError: any) {
      console.error("Database connection error:", dbError.message);
    }

    // Create a streaming response using AI SDK with tool calling
    const result = streamText({
      model: openai('gpt-4o'),
      messages: formattedMessages,
      temperature: 0.5,
      maxTokens: 1500,
      toolCallStreaming: false, // Disable streaming of tool calls to ensure complete responses
      tools: {
        storeUserPerformanceScores: {
          description: 'Store initial performance scores for a user when a job title is identified',
          parameters: z.object({ 
            jobTitle: z.string().describe('The target job title identified from user input') 
          }),
          execute: async ({ jobTitle }: { jobTitle: string }) => {
            try {
              console.log(`[TOOL] Storing scores for job title: ${jobTitle} (session: ${conversationId})`);
              
              // If we've already stored scores for this session, don't do it again
              if (hasStoredScores) {
                console.log(`[TOOL] Already stored scores for this session - preventing duplicate call`);
                return `User performance scores already exist for this session. Please continue generating an appropriate problem for a Software Engineer.`;
              }
              
              // Handle the case where conversationId might not be available yet
              if (!conversationId) {
                console.warn('[TOOL] No conversation ID available yet');
                return `Note: Job title "${jobTitle}" recognized. Performance tracking will begin once the conversation is initialized. Please continue with your response.`;
              }
              
              // Input validation - ensure we have valid UUIDs
              if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
                console.error(`[TOOL] Invalid userId format: ${userId}`);
                return `Failed to store performance scores: Invalid user ID format`;
              }
              
              if (!conversationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
                console.error(`[TOOL] Invalid conversationId format: ${conversationId}`);
                return `Failed to store performance scores: Invalid conversation ID format`;
              }
              
              // First check if we already have scores for this session
              const existingScores = await prisma.user_performance_scores.findFirst({
                where: {
                  user_id: userId,
                  session_id: conversationId
                }
              });
              
              if (existingScores) {
                console.log(`[TOOL] Scores already exist for session ${conversationId}`);
                hasStoredScores = true; // Mark that we've checked and found scores
                return `User performance scores already exist for this session`;
              }
              
              const scores = generateInitialScores(jobTitle, userId, conversationId);
              
              // Log the generated scores for debugging
              console.log(`[TOOL] Generated scores:`, {
                id: scores.id,
                user_id: userId,
                session_id: conversationId,
                targetJobTitle: scores.targetJobTitle
              });
              
              // Create new scores - ensure UUID is properly formatted for PostgreSQL
              // The database expects a UUID type without quotes
              const result = await prisma.user_performance_scores.create({
                data: {
                  id: scores.id,  // UUID is already generated correctly by uuidv4()
                  user_id: userId,
                  session_id: conversationId,
                  problemUnderstanding: scores.problemUnderstanding,
                  dataStructureChoice: scores.dataStructureChoice,
                  timeComplexity: scores.timeComplexity,
                  codingStyle: scores.codingStyle,
                  edgeCases: scores.edgeCases,
                  languageUsage: scores.languageUsage,
                  communication: scores.communication,
                  optimization: scores.optimization,
                  totalScore: scores.totalScore,
                  targetJobTitle: scores.targetJobTitle
                }
              });
              
              // Mark that we've successfully stored scores to prevent further calls
              hasStoredScores = true;
              
              console.log(`[TOOL] Stored scores with ID: ${result.id}`);
              return `Successfully stored initial performance scores for job title: ${jobTitle}. Now, please continue by generating an appropriate programming problem for this user.`;
            } catch (error: any) {
              console.error('[TOOL] Error storing scores:', error.message);
              
              // Log additional error details for debugging
              if (error.stack) {
                console.error('[TOOL] Error stack:', error.stack);
              }
              
              if (error.code) {
                console.error('[TOOL] Error code:', error.code);
              }
              
              return `Failed to store performance scores: ${error.message}`;
            }
          },
        },
      },
    });

    // Return the AI SDK stream with proper tool call streaming support
    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `There was an error processing your request: ${error.message}` },
      { status: 500 }
    )
  }
} 