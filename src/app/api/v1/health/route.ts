import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: Returns server health status. No authentication required.
 *     tags:
 *       - Health
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *                   example: Backend is reachable from your mobile device!
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend is reachable from your mobile device!',
  }, { status: 200 });
}