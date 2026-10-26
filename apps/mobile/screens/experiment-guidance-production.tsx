import React, { useEffect, useRef } from 'react'
import { Text, View } from 'react-native'
import { runOnJS } from 'react-native-reanimated'
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera'

const convertToBase64 = (frame: any): string => {
  // Convert camera frame to base64 JPEG
  // This is a placeholder implementation
  return frame.image.toString('base64')
}

export default function ExperimentGuidance() {
  const device = useCameraDevice('back')
  const { hasPermission, requestPermission } = useCameraPermission()
  const wsRef = useRef<WebSocket | null>(null)
  const lastSentRef = useRef<number>(0)

  useEffect(() => {
    requestPermission()

    const ws = new WebSocket(
      'ws://YOUR_IP:3000/api/experiments/exp-123/guidance?token=JWT'
    )

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'text_delta') {
        console.log('AI:', data.content)
      }
    }

    wsRef.current = ws

    return () => ws.close()
  }, [])

  const sendFrameToServer = (base64: string) => {
    wsRef.current?.send(JSON.stringify({
      type: 'send_frame',
      frameData: base64,
      mimeType: 'image/jpeg'
    }))
  }

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'

    const now = Date.now()
    if (now - lastSentRef.current < 800) return // 1–1.5 FPS throttle

    lastSentRef.current = now

    // You need a native frame → JPEG plugin here
    // For now assume you have a function convertToBase64(frame)

    const base64 = convertToBase64(frame)

    runOnJS(sendFrameToServer)(base64)
  }, [])

  if (!device || !hasPermission) return <Text>Loading...</Text>

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
    </View>
  )
}