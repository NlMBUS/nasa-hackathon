import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Globe, { GlobeRef } from './Globe';

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
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [selectedMeteor, setSelectedMeteor] = useState('');
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  // Meteor info
  const [meteorDiameter, setMeteorDiameter] = useState<string>('');
  const [meteorVelocity, setMeteorVelocity] = useState<string>('');
  const [meteorDiameterValue, setMeteorDiameterValue] = useState<number>(50); // used for globe dome

  const globeRef = useRef<GlobeRef>(null);

  // Show preview marker when lat/long changes
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

  // Fetch meteor list
  useEffect(() => {
    const fetchMeteors = async () => {
      try {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        console.log(formattedDate);

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

  // Fetch selected meteor's details
  useEffect(() => {
    const fetchMeteorDetails = async () => {
      if (!selectedMeteor) return;
      try {
        const meteor = meteors.find(m => m.id === selectedMeteor);
        if (!meteor) return;

        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        console.log(formattedDate);

        const res = await fetch(
        `https://api.nasa.gov/neo/rest/v1/feed?start_date=${formattedDate}&end_date=${formattedDate}&api_key=d5sG616sal9PHsMGN9OupaZK4hB28sLQx3ywNdL3`
        );
        const data = await res.json();
        // console.log(data.near_earth_objects["2025-10-05"][index]["estimated_diameter"]["meters"]["estimated_diameter_min"])
        // console.log(data)
        const diameterMin = data.near_earth_objects["2025-10-05"][index]["estimated_diameter"]["meters"]["estimated_diameter_min"];
        const diameterMax = data.near_earth_objects["2025-10-05"][index]["estimated_diameter"]["meters"]["estimated_diameter_max"];
        const velocity = data.near_earth_objects["2025-10-05"][index]["close_approach_data"][0]["relative_velocity"]["kilometers_per_second"];
        setMeteorDiameter(`${diameterMin.toFixed(2)} - ${diameterMax.toFixed(2)} m`);
        setMeteorDiameterValue((diameterMin+diameterMax)/2)
        setMeteorVelocity(`${Number(velocity).toFixed(2)} km/s`);
        setMeteorDiameterValue((diameterMin + diameterMax) / 2); // average diameter for dome size
      } catch (error) {
        console.error('Failed to fetch meteor details', error);
      }
    };

    fetchMeteorDetails();
  }, [selectedMeteor]);

  const handleLaunch = () => {
    if (!impact) {
      globeRef.current?.injectJavaScript(`
        if (window.addRedDome) {
          window.addRedDome(${longitude}, ${latitude}, ${meteorDiameterValue});
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
                // index - 1 because the first item is the placeholder (“-- Select a Meteor --”)
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
          <Text style={styles.infoText}>Diameter: {meteorDiameter}</Text>
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
