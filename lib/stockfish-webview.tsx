import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

// ------------------------------------------------------------------
// Public API exposed via ref
// ------------------------------------------------------------------
export interface StockfishWebViewRef {
  /** Send a raw UCI command string to the engine. */
  sendCommand: (cmd: string) => void;
}

interface Props {
  /** Called every time the engine sends a line of UCI output. */
  onMessage: (line: string) => void;
}

// ------------------------------------------------------------------
// Build the HTML that runs stockfish inside the WebView
// ------------------------------------------------------------------
function buildHtml(sfJsUri: string, sfWasmUri: string): string {
  // We launch stockfish as a Web Worker from the local file URI.
  // The worker file is the JS entry-point; it will fetch the .wasm
  // from the same directory (we pass the wasmBinary path via postMessage).
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script>
(function() {
  var wasmSupported = typeof WebAssembly === 'object' &&
    WebAssembly.validate(Uint8Array.of(0x0,0x61,0x73,0x6d,0x01,0x00,0x00,0x00));

  // stockfish.js supports WASM when its companion .wasm is present.
  // We always have the .wasm file, so we use it when WASM is supported.
  var workerSrc = ${JSON.stringify(sfJsUri)};

  var sf = new Worker(workerSrc);

  // Forward engine output to React Native
  sf.onmessage = function(e) {
    if (typeof e.data === 'string') {
      window.ReactNativeWebView.postMessage(e.data);
    }
  };

  sf.onerror = function(e) {
    window.ReactNativeWebView.postMessage('ERROR: ' + (e.message || 'worker failed'));
  };

  // Receive commands from React Native and forward to engine
  window.addEventListener('message', function(e) {
    try {
      var cmd = typeof e.data === 'string' ? e.data : JSON.parse(e.data).cmd;
      sf.postMessage(cmd);
    } catch(err) {}
  });

  // Boot UCI
  sf.postMessage('uci');
})();
</script>
</body>
</html>`;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export const StockfishWebView = forwardRef<StockfishWebViewRef, Props>(
  function StockfishWebView({ onMessage }, ref) {
    const webviewRef = useRef<WebView>(null);
    const [html, setHtml] = useState<string | null>(null);
    const [baseUrl, setBaseUrl] = useState<string>("");

    // Resolve asset URIs once on mount
    useEffect(() => {
      let cancelled = false;

      async function prepare() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sfJsAsset = Asset.fromModule(require("../assets/stockfish_js.txt"));
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sfWasmAsset = Asset.fromModule(require("../assets/stockfish.wasm"));

        await Promise.all([sfJsAsset.downloadAsync(), sfWasmAsset.downloadAsync()]);

        if (cancelled) return;

        // Ensure we copy the assets out of the bundle into a writable/readable directory
        // with the CORRECT extensions (.js and .wasm) so the Worker runs them properly.
        // We do this on both iOS and Android.
        const dest = FileSystem.documentDirectory!;
        const jsPath = dest + "stockfish.js";
        const wasmPath = dest + "stockfish.wasm";

        const [jsCopy, wasmCopy] = await Promise.all([
          FileSystem.getInfoAsync(jsPath),
          FileSystem.getInfoAsync(wasmPath),
        ]);

        const jsUri = sfJsAsset.localUri ?? sfJsAsset.uri;
        const wasmUri = sfWasmAsset.localUri ?? sfWasmAsset.uri;

        const copies: Promise<any>[] = [];
        if (!jsCopy.exists) {
          copies.push(FileSystem.copyAsync({ from: jsUri, to: jsPath }));
        }
        if (!wasmCopy.exists) {
          copies.push(FileSystem.copyAsync({ from: wasmUri, to: wasmPath }));
        }
        
        if (copies.length > 0) {
          await Promise.all(copies);
        }

        setBaseUrl(dest);
        if (!cancelled) setHtml(buildHtml(jsPath, wasmPath));
      }

      prepare();
      return () => { cancelled = true; };
    }, []);

    useImperativeHandle(ref, () => ({
      sendCommand(cmd: string) {
        // injectJavaScript runs on the WebView's main thread.
        webviewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(cmd)} }));
          true;
        `);
      },
    }));

    if (!html) return null;

    return (
      // Zero-size but must be in tree so it renders and executes.
      <View style={{ width: 0, height: 0, overflow: "hidden" }}>
        <WebView
          ref={webviewRef}
          source={{ html, baseUrl }}
          originWhitelist={["*"]}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          allowFileAccessFromFileURLs
          javaScriptEnabled
          onMessage={(e: WebViewMessageEvent) => onMessage(e.nativeEvent.data)}
          style={{ width: 1, height: 1 }}
        />
      </View>
    );
  }
);
