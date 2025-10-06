import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Globe, { GlobeRef } from './Components/Globe';
import { craterDepth, craterRadius, lethalDistance } from './Components/Math';

type Meteor = {
  id: string;
  name: string;
  link: string;
};

export default function SelectorScreen() {
  const [impact, setImpact] = useState(false);
  const [latitudeStr, setLatitudeStr] = useState('0');
  const [longitudeStr, setLongitudeStr] = useState('0');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [radius, setRadius] = useState(0);
  const [depth, setDepth] = useState(0);
  const [index, setIndex] = useState(0);
  const [diameter, setDiameter] = useState<string>('');
  const [meteorVelocity, setMeteorVelocity] = useState<string>('');
  const [diameterValue, setDiameterValue] = useState<number>(50); 
  const [selectedMeteor, setSelectedMeteor] = useState('');
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [loading, setLoading] = useState(true);
  const globeRef = useRef<GlobeRef>(null);

   useEffect(() => {
    if (!impact) {
      globeRef.current?.injectJavaScript(`
        if (window.showPreviewCylinder) {
          window.showPreviewCylinder(${longitude}, ${latitude}, 90, 1);
        }
        true;
      `);
    }
  }, [latitude, longitude, impact]);

  const handleLaunch = () => {
    if (!impact) {
      const firstFour = meteorVelocity.slice(0, 4); 
      const floatVelocity = parseFloat(firstFour);
      const shockwave = 2*lethalDistance("rock", diameterValue, floatVelocity); 
      const radiusVal = craterRadius("rock",diameterValue, floatVelocity);
      const depthVal = craterDepth("rock",diameterValue, floatVelocity);
      setRadius(radiusVal);
      setDepth(depthVal);
      globeRef.current?.injectJavaScript(`
        if (window.addRedDome) {
          window.addRedDome(${longitude}, ${latitude}, ${shockwave*2});
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
      globeRef.current?.injectJavaScript(`window.removeRedDome(); true;`);
    }
    setImpact(!impact);
  };

  useEffect(() => {
    const fetchMeteors = async () => {
      try {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];

        const res = await fetch(
        `https://api.nasa.gov/neo/rest/v1/feed?start_date=${formattedDate}&end_date=${formattedDate}&api_key=d5sG616sal9PHsMGN9OupaZK4hB28sLQx3ywNdL3`
        );
        const data = await res.json();
        const allMeteors: Meteor[] = Object.values(data.near_earth_objects)
          .flat()
          .map((m: any) => ({
            id: m.id,
            name: m.name,
            link: m.links.self,
          }));

        allMeteors.sort((a, b) => a.name.localeCompare(b.name));
        setMeteors(allMeteors);
      } catch (error) {
        console.error('Failed to fetch meteors', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeteors();
  }, []);

  useEffect(() => {
    const fetchMeteorDetails = async () => {
      if (!selectedMeteor) return;
      try {
        const meteor = meteors.find(m => m.id === selectedMeteor);
        if (!meteor) return;
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const res = await fetch(
        `https://api.nasa.gov/neo/rest/v1/feed?start_date=${formattedDate}&end_date=${formattedDate}&api_key=d5sG616sal9PHsMGN9OupaZK4hB28sLQx3ywNdL3`
        );
        const data = await res.json();
        const diameterMin = data.near_earth_objects[formattedDate][index]["estimated_diameter"]["meters"]["estimated_diameter_min"];
        const diameterMax = data.near_earth_objects[formattedDate][index]["estimated_diameter"]["meters"]["estimated_diameter_max"];
        const incomingVelocity = data.near_earth_objects[formattedDate][index]["close_approach_data"][0]["relative_velocity"]["kilometers_per_second"];
        setDiameter(`${diameterMin.toFixed(2)} - ${diameterMax.toFixed(2)} m`);
        setDiameterValue((diameterMin+diameterMax)/2)
        setMeteorVelocity(`${Number(incomingVelocity).toFixed(2)} km/s`);
        setDiameterValue((diameterMin + diameterMax) / 2); 
      } catch (error) {
        console.error('Failed to fetch meteor details', error);
      }
    };

    fetchMeteorDetails();
  }, [selectedMeteor]);

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
      <Text style={styles.title}>Today's Meteor Forecast</Text>
      <Globe ref={globeRef} />

      <Text style={styles.label}>Select Meteor</Text>
      {loading ? (
        <Text>Loading meteors...</Text>
      ) : (
        <Picker
            selectedValue={selectedMeteor}
            onValueChange={(value, index) => {
                setSelectedMeteor(value);
                setIndex(index-1)
            }}
            >
            <Picker.Item label="-- Select a Meteor --" value="" />
            {meteors.map((meteor) => (
                <Picker.Item key={meteor.id} label={meteor.name} value={meteor.id} />
            ))}
            </Picker>
      )}

      {selectedMeteor !== '' && (
        <View style={{ marginVertical: 10 }}>
          <Text style={styles.infoText}>Diameter: {diameter}</Text>
          <Text style={styles.infoText}>Velocity: {meteorVelocity}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            keyboardType="default"
            value={latitudeStr}
            onChangeText={handleLatitudeChange}
          />
        </View>
        <View style={{ flex: 1 }}>
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
        <TouchableOpacity
          style={[styles.button, { opacity: selectedMeteor ? 1 : 0.5 }]}
          onPress={handleLaunch}
          disabled={!selectedMeteor}
        >
          <Text style={styles.buttonText}>{impact ? 'Reset' : 'Launch'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.label}>{`The radius of the shockwave is ${radius.toFixed(5)} km.`}</Text>
        <Text style={styles.label}>{`The depth of the crater is ${depth.toFixed(5)} km.`}</Text>
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
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
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
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
