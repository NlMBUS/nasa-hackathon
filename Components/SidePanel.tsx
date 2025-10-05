import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Globe, { GlobeRef } from './Globe';

export default function SelectorScreen() {
  const [impact, setImpact] = useState(false);
const [latitudeStr, setLatitudeStr] = useState('0');
const [longitudeStr, setLongitudeStr] = useState('0');
const [latitude, setLatitude] = useState(0);
const [longitude, setLongitude] = useState(0);
  const [diameter, setDiameter] = useState(50);
  const [velocity, setVelocity] = useState(50); // separate state for second slider
  const globeRef = useRef<GlobeRef>(null);

useEffect(() => {
  if (!impact) {
    console.log("A", impact)
    globeRef.current?.injectJavaScript(`
    if (window.showPreviewCylinder) {
        window.showPreviewCylinder(${latitude}, ${longitude}, 50, 1);
    }
    true;
    `);
  }
}, [latitude, longitude, impact]);

const handleLaunch = () => {
  if (!impact) {
    // Meteor impacts: add dome
    globeRef.current?.injectJavaScript(`
      if (window.addRedDome) {
        window.addRedDome(${latitude}, ${longitude}, ${diameter});
      }
      if (window.removePreviewSphere) {
        window.removePreviewSphere();
      }
      if (window.previewMesh) {
        globe.scene().remove(window.previewMesh);
        if (window.previewMesh.geometry) window.previewMesh.geometry.dispose();
        if (window.previewMesh.material) window.previewMesh.material.dispose();
        window.previewMesh = null;
      }
      true;
    `);
  } else {
    // Reset: remove dome
    globeRef.current?.injectJavaScript(`window.removeRedDome(); true;`);
  }

  setImpact(!impact);
};


  const handleDiameterChange = (text: string) => {
    const value = Number(text);
    if (!isNaN(value)) setDiameter(value);
  };

  const handleVelocityChange = (text: string) => {
    const value = Number(text);
    if (!isNaN(value)) setVelocity(value);
  };

const handleLatitudeChange = (text: string) => {
  setLatitudeStr(text);
  const value = Number(text);
  if (!isNaN(value) && value >= -90 && value <= 90) {
    setLatitude(value);
  }
};

const handleLongitudeChange = (text: string) => {
  setLongitudeStr(text);
  const value = Number(text);
  if (!isNaN(value) && value >= -180 && value <= 180) {
    setLongitude(value);
  }
};


  return (
    <View style={styles.container}>
    <Globe ref={globeRef} />
      <Text style={styles.label}>Diameter</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={diameter}
        onValueChange={setDiameter}
        minimumTrackTintColor="#1EB1FC"
        maximumTrackTintColor="#8ED1FC"
        thumbTintColor="#007AFF"
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={diameter.toString()}
          onChangeText={handleDiameterChange}
        />
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={velocity.toString()}
          onChangeText={handleVelocityChange}
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{flex:1}}>
            <Text style={styles.label}>Latitude</Text>
<TextInput
  style={styles.input}
  keyboardType="default"
  value={latitudeStr}
  onChangeText={handleLatitudeChange}
/>
        </View>
        <View style={{flex:1}}>
            <Text style={styles.label}>Longitude</Text>
<TextInput
  style={styles.input}
  keyboardType="default"
  value={longitudeStr}
  onChangeText={handleLongitudeChange}
/>
        </View>
      </View>
      <View style={{ marginTop: 16 }}>
        <TouchableOpacity style={styles.button} onPress={handleLaunch}>
          <Text style={styles.buttonText}>{impact ? "Reset":"Launch"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    justifyContent: 'space-between',
    marginHorizontal: 8,
  },
  valueText: {
    fontSize: 16,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    width: 80,
    padding: 5,
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
