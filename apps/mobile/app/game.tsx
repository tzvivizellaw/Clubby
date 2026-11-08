import { useEffect } from 'react'
import { View, Platform } from 'react-native'
import { WebView } from 'react-native-webview'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { GOAL_RUSH_HTML } from '../lib/game/goalRushHtml'

// Goal Rush — 3v3 arcade football mini-game.
// The game itself is a self-contained HTML5 canvas page (lib/game/goal-rush.html);
// it posts 'exit' when the player taps ✕ on its menu.
export default function GameScreen() {
  const router = useRouter()

  const exit = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/wallet' as never)
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const onMessage = (e: MessageEvent) => { if (e.data === 'exit') exit() }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0a1e' }} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      {Platform.OS === 'web' ? (
        <View style={{ flex: 1 }}>
          <iframe
            title="Goal Rush"
            srcDoc={GOAL_RUSH_HTML}
            style={{ flex: 1, border: 'none', width: '100%', height: '100%', background: '#0f0a1e' }}
          />
        </View>
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: GOAL_RUSH_HTML }}
          style={{ flex: 1, backgroundColor: '#0f0a1e' }}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          mediaPlaybackRequiresUserAction={false}
          onMessage={(e) => { if (e.nativeEvent.data === 'exit') exit() }}
        />
      )}
    </SafeAreaView>
  )
}
