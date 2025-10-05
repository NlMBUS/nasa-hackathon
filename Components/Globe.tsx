// Globe.tsx
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface GlobeRef {
  injectJavaScript: (js: string) => void;
}

const Globe = forwardRef<GlobeRef>((props, ref) => {
  const webviewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    injectJavaScript: (js: string) => {
      webviewRef.current?.injectJavaScript(js);
    },
  }));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; overflow: hidden; }
          #globeViz { width: 100vw; height: 100vh; }
        </style>
        <script src="https://unpkg.com/three@0.152.2/build/three.min.js"></script>
        <script src="https://unpkg.com/globe.gl"></script>
      </head>
      <body>
        <div id="globeViz"></div>
        <script>
          // helper to send debug -> React Native
          function postDebug(o) {
            try { window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){ console.log('postDebug failed', e) }
          }

          const globe = Globe()(document.getElementById('globeViz'))
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-day.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundColor('#FFFFFF');

          globe.controls().autoRotate = true;
          globe.controls().autoRotateSpeed = 0.5;

          // lights (once)
          globe.onGlobeReady(() => {
            const scene = globe.scene();
            // simple lighting so preview/dome are visible
            const ambient = new THREE.AmbientLight(0x999999, 0.6);
            scene.add(ambient);
            const dir = new THREE.DirectionalLight(0xffffff, 0.8);
            dir.position.set(100, 100, 100);
            scene.add(dir);

            postDebug({type: 'ready'});
          });

          // consistent lat/lng -> XYZ used for both preview and dome
          function latLngToXYZ(lat, lng) {
            const R = globe.getGlobeRadius();
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 180) * (Math.PI / 180);

            // three-globe uses this coordinate convention for its points
            const x = -R * Math.sin(phi) * Math.cos(theta);
            const y = R * Math.cos(phi);
            const z = R * Math.sin(phi) * Math.sin(theta);
            return [x, y, z];
          }

window.showPreviewCylinder = function(lat, lng, height = 20, radius = 0.6) {
  try {
    // Remove previous preview
    if (window.previewMesh) {
      globe.scene().remove(window.previewMesh);
      if (window.previewMesh.geometry) window.previewMesh.geometry.dispose();
      if (window.previewMesh.material) window.previewMesh.material.dispose();
      window.previewMesh = null;
    }

    const [x, y, z] = latLngToXYZ(lat, lng);

    // Create cylinder geometry
    const geom = new THREE.CylinderGeometry(radius, radius, height, 32);
    const mat = new THREE.MeshStandardMaterial({ 
      color: 'red', 
      transparent: true, 
      opacity: 0.8, 
      side: THREE.DoubleSide 
    });
    const mesh = new THREE.Mesh(geom, mat);

    // Move cylinder so base sits on globe surface
    mesh.position.set(x, y, z);

    // Orient cylinder along surface normal
    const normal = new THREE.Vector3(x, y, z).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    mesh.quaternion.copy(quaternion);

    globe.scene().add(mesh);
    window.previewMesh = mesh;

    postDebug({ type: 'preview', lat, lng, pos: [x, y, z], radius: globe.getGlobeRadius() });
  } catch (e) {
    postDebug({ type: 'error', fn: 'showPreviewCylinder', e: String(e) });
  }
};


          window.removePreviewSphere = function() {
            if (window.previewMesh) {
              globe.scene().remove(window.previewMesh);
              if (window.previewMesh.geometry) window.previewMesh.geometry.dispose();
              if (window.previewMesh.material) window.previewMesh.material.dispose();
              window.previewMesh = null;
            }
            postDebug({ type: 'preview-removed' });
          };

          // DOME: larger, semi-transparent sphere (centered at same point)
          window.addRedDome = function(lat, lng, domeRadius = 2) {
            try {
              // remove previous dome
              if (window.currentDome) {
                globe.scene().remove(window.currentDome);
                if (window.currentDome.geometry) window.currentDome.geometry.dispose();
                if (window.currentDome.material) window.currentDome.material.dispose();
                window.currentDome = null;
              }

              const [x, y, z] = latLngToXYZ(lat, lng);

              // create a FULL sphere so center is simple to reason about (they will overlap exactly)
              // you can change to hemisphere later once alignment is good
              const geom = new THREE.SphereGeometry(domeRadius, 32, 16);
              const mat = new THREE.MeshStandardMaterial({
                color: 'red',
                transparent: true,
                opacity: 0.45,
                side: THREE.DoubleSide
              });

              const dome = new THREE.Mesh(geom, mat);
              dome.position.set(x, y, z);

              globe.scene().add(dome);
              window.currentDome = dome;

              postDebug({ type: 'dome', lat, lng, pos: [x,y,z], domeRadius });
            } catch (e) {
              postDebug({ type: 'error', fn: 'addRedDome', e: String(e) });
            }
          };

          window.removeRedDome = function() {
            if (window.currentDome) {
              globe.scene().remove(window.currentDome);
              if (window.currentDome.geometry) window.currentDome.geometry.dispose();
              if (window.currentDome.material) window.currentDome.material.dispose();
              window.currentDome = null;
            }
            postDebug({ type: 'dome-removed' });
          };

          // small helper so pages can ask "are functions ready?"
          window._globeReady = false;
          globe.onGlobeReady(() => {
            window._globeReady = true;
          });
        </script>
      </body>
    </html>
  `;

  // capture WebView messages so you can see the debug info in RN console
  const handleMessage = (event: any) => {
    try {
      const d = JSON.parse(event.nativeEvent.data);
      console.log('[WebView]', d);
    } catch (e) {
      console.log('[WebView] non-json message:', event.nativeEvent.data);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        javaScriptEnabled={true}
        onMessage={handleMessage}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { width: '100%', height: 400 },
  webview: { flex: 1 },
});

export default Globe;
