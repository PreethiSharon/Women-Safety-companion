'use server';
/**
 * @fileOverview Automatically detects if the user has stopped moving unexpectedly and sends a check-in text.
 *
 * - unexpectedStopCheckIn - A function that handles the unexpected stop check-in process.
 * - UnexpectedStopCheckInInput - The input type for the unexpectedStopCheckIn function.
 * - UnexpectedStopCheckInOutput - The return type for the unexpectedStopCheckIn function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UnexpectedStopCheckInInputSchema = z.object({
  latitude: z.number().describe('The latitude of the user.'),
  longitude: z.number().describe('The longitude of the user.'),
  lastKnownLatitude: z.number().describe('The last known latitude of the user.'),
  lastKnownLongitude: z.number().describe('The last known longitude of the user.'),
  timeStopped: z.number().describe('The time in seconds that the user has been stopped.'),
  guardianPhoneNumber: z.string().describe('The phone number of the guardian to send the check-in text to.'),
  userPhoneNumber: z.string().describe('The phone number of the user to send the check-in text from.'),
});
export type UnexpectedStopCheckInInput = z.infer<typeof UnexpectedStopCheckInInputSchema>;

const UnexpectedStopCheckInOutputSchema = z.object({
  shouldSendCheckIn: z.boolean().describe('Whether or not a check-in text should be sent.'),
});
export type UnexpectedStopCheckInOutput = z.infer<typeof UnexpectedStopCheckInOutputSchema>;

export async function unexpectedStopCheckIn(input: UnexpectedStopCheckInInput): Promise<UnexpectedStopCheckInOutput> {
  return unexpectedStopCheckInFlow(input);
}

const unexpectedStopCheckInPrompt = ai.definePrompt({
  name: 'unexpectedStopCheckInPrompt',
  input: {schema: UnexpectedStopCheckInInputSchema},
  output: {schema: UnexpectedStopCheckInOutputSchema},
  prompt: `You are a safety assistant that determines if a check-in text should be sent to a user based on their location and time stopped.

  The user's current latitude is {{{latitude}}} and longitude is {{{longitude}}}.
  The user's last known latitude was {{{lastKnownLatitude}}} and longitude was {{{lastKnownLongitude}}}.
  The user has been stopped for {{{timeStopped}}} seconds.
  The guardian's phone number is {{{guardianPhoneNumber}}}.

  Determine if the user has stopped unexpectedly. If the user has stopped unexpectedly, return true for shouldSendCheckIn. Otherwise, return false.
  `,
});

const unexpectedStopCheckInFlow = ai.defineFlow(
  {
    name: 'unexpectedStopCheckInFlow',
    inputSchema: UnexpectedStopCheckInInputSchema,
    outputSchema: UnexpectedStopCheckInOutputSchema,
  },
  async input => {
    const {output} = await unexpectedStopCheckInPrompt(input);
    return output!;
  }
);
