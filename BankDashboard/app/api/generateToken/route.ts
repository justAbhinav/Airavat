import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and FormData requests
    let emailId, userId, file, activeDurationSeconds
    
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData for file uploads
      const formData = await request.formData()
      emailId = formData.get('emailId') as string
      userId = formData.get('userId') as string
      file = formData.get('file') as File
      activeDurationSeconds = parseInt(formData.get('activeDurationSeconds') as string)
    } else {
      // Handle JSON requests
      const data = await request.json()
      emailId = data.emailId
      userId = data.userId
      file = data.file
      activeDurationSeconds = data.activeDurationSeconds
    }

    // Validate input
    if (!emailId || !userId) {
      return NextResponse.json(
        { error: 'Email ID and User ID are required' },
        { status: 400 }
      )
    }

    if (!activeDurationSeconds || activeDurationSeconds <= 0) {
      return NextResponse.json(
        { error: 'Active duration must be provided and greater than 0' },
        { status: 400 }
      )
    }

    // Call the webhook with the required format
    const webhookUrl = process.env.WEBHOOK_URL || 'https://amd-varying-screening-janet.trycloudflare.com/webhook/data-submit-hook'
    const jwtToken = process.env.WEBHOOK_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.e30.NO3TAh5-AR98dkx9UIgBDE-u4hZs4Rh7F0qu8iRfob8'

    // Prepare form data for the webhook
    const formData = new FormData()
    formData.append('email', emailId)
    
    const hashedUserId = crypto.createHash("sha256").update(userId).digest("hex")
    formData.append('userHash', hashedUserId)
    
    formData.append('ttl', activeDurationSeconds.toString())
    if (file) {
      // Ensure file is properly handled as binary
      if (file instanceof File) {
        formData.append('file', file, file.name);
      } else {
        // If file is base64 or other format, convert to blob
        console.log("file",file);
        const blob = new Blob([file])
        console.log("blob",blob);
        formData.append('file', blob, 'file')
      }
    }

    console.log('Calling webhook:', webhookUrl)
    console.log('Data:', { email: emailId, userHash: hashedUserId, activeDurationSeconds, hasFile: !!file })

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'User-Agent': 'BankDashboard/1.0',
        },
        body: formData,
      })

      console.log('Webhook response status:', webhookResponse.status)
      console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()))

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`)
      }

      let webhookResult;
      const contentType = webhookResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        webhookResult = await webhookResponse.json();
      } else {
        webhookResult = await webhookResponse.text(); // or .blob() for files
      }

      console.log('Webhook response body:', webhookResult)

      // Use the token from the webhook response
      const tokenId = webhookResult.tokenId || webhookResult.token || webhookResult.id
      
      if (!tokenId) {
        console.error('No token found in webhook response. Available fields:', Object.keys(webhookResult))
        throw new Error('No token received from webhook')
      }

      return NextResponse.json({
        success: true,
        tokenId,
        message: 'Token received from webhook successfully',
        webhookResponse: webhookResult,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })

    } catch (webhookError) {
      console.error('Webhook error details:', webhookError)
      
      const errorMessage = (webhookError as Error).message || String(webhookError)
      
      // Check if it's a connection error (webhook not running)
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('Failed to fetch')) {
        return NextResponse.json({
          success: false,
          error: 'Webhook server is not running',
          message: `Cannot connect to webhook at ${webhookUrl}. Please start your webhook server.`,
          webhookUrl: webhookUrl,
        }, { status: 503 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to get token from webhook',
        webhookError: errorMessage,
        webhookUrl: webhookUrl,
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
