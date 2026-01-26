import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useOnboarding } from '../../context/OnboardingContext';

type OnboardingStackParamList = {
  Welcome: undefined;
  Photo: undefined;
  Basics: undefined;
  Gender: undefined;
  Seeking: undefined;
  Goals: undefined;
  Interests: undefined;
  Complete: undefined;
};

// Global cities for autocomplete
const GLOBAL_CITIES = [
  // North America
  'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Houston, USA', 'Phoenix, USA',
  'Philadelphia, USA', 'San Antonio, USA', 'San Diego, USA', 'Dallas, USA', 'San Jose, USA',
  'Austin, USA', 'Seattle, USA', 'Denver, USA', 'Boston, USA', 'Nashville, USA',
  'Portland, USA', 'Las Vegas, USA', 'Miami, USA', 'Atlanta, USA', 'San Francisco, USA',
  'Toronto, Canada', 'Montreal, Canada', 'Vancouver, Canada', 'Calgary, Canada', 'Ottawa, Canada',
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico',
  // Europe
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Liverpool, UK', 'Edinburgh, UK',
  'Glasgow, UK', 'Bristol, UK', 'Leeds, UK', 'Belfast, UK', 'Dublin, Ireland',
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Nice, France',
  'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Frankfurt, Germany', 'Cologne, Germany',
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands',
  'Brussels, Belgium', 'Antwerp, Belgium',
  'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Florence, Italy',
  'Lisbon, Portugal', 'Porto, Portugal',
  'Vienna, Austria', 'Salzburg, Austria',
  'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland',
  'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden',
  'Oslo, Norway', 'Bergen, Norway',
  'Copenhagen, Denmark', 'Aarhus, Denmark',
  'Helsinki, Finland', 'Tampere, Finland',
  'Warsaw, Poland', 'Krakow, Poland', 'Gdansk, Poland',
  'Prague, Czech Republic', 'Brno, Czech Republic',
  'Budapest, Hungary',
  'Athens, Greece', 'Thessaloniki, Greece',
  // Australia & New Zealand
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
  'Adelaide, Australia', 'Gold Coast, Australia', 'Newcastle, Australia', 'Canberra, Australia',
  'Hobart, Australia', 'Darwin, Australia',
  'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand',
  // Asia
  'Tokyo, Japan', 'Osaka, Japan', 'Kyoto, Japan', 'Yokohama, Japan', 'Nagoya, Japan',
  'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea',
  'Beijing, China', 'Shanghai, China', 'Guangzhou, China', 'Shenzhen, China', 'Hong Kong',
  'Taipei, Taiwan', 'Kaohsiung, Taiwan',
  'Singapore',
  'Bangkok, Thailand', 'Chiang Mai, Thailand', 'Phuket, Thailand',
  'Kuala Lumpur, Malaysia', 'Penang, Malaysia',
  'Jakarta, Indonesia', 'Bali, Indonesia',
  'Manila, Philippines', 'Cebu, Philippines',
  'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Hyderabad, India', 'Chennai, India',
  'Dubai, UAE', 'Abu Dhabi, UAE',
  'Tel Aviv, Israel', 'Jerusalem, Israel',
  // South America
  'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil', 'Salvador, Brazil',
  'Buenos Aires, Argentina', 'Córdoba, Argentina',
  'Santiago, Chile', 'Valparaíso, Chile',
  'Lima, Peru', 'Cusco, Peru',
  'Bogotá, Colombia', 'Medellín, Colombia', 'Cartagena, Colombia',
  // Africa
  'Cape Town, South Africa', 'Johannesburg, South Africa', 'Durban, South Africa',
  'Cairo, Egypt', 'Alexandria, Egypt',
  'Lagos, Nigeria', 'Nairobi, Kenya', 'Casablanca, Morocco',
].sort();

const OnboardingBasicsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { data, updateData, nextStep, prevStep, canProceed } = useOnboarding();
  const [locationQuery, setLocationQuery] = useState(data.location || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [ageError, setAgeError] = useState('');

  const handleContinue = () => {
    nextStep();
    navigation.navigate('Goals');
  };

  const handleBack = () => {
    prevStep();
    navigation.goBack();
  };

  const handleNameChange = (text: string) => {
    updateData({ name: text });
  };

  const handleAgeChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText === '') {
      updateData({ age: null });
      setAgeError('');
      return;
    }

    const age = parseInt(numericText, 10);
    updateData({ age });

    if (age < 18) {
      setAgeError('You must be at least 18 years old');
    } else if (age > 100) {
      setAgeError('Please enter a valid age');
    } else {
      setAgeError('');
    }
  };

  const handleLocationChange = (text: string) => {
    setLocationQuery(text);
    setShowSuggestions(text.length > 0);
    // Clear the stored location if user is typing something different
    if (text !== data.location) {
      updateData({ location: '' });
    }
  };

  const selectLocation = (location: string) => {
    setLocationQuery(location);
    updateData({ location });
    setShowSuggestions(false);
  };

  // Filter cities based on query
  const filteredCities = locationQuery.length > 0
    ? GLOBAL_CITIES.filter(city =>
        city.toLowerCase().includes(locationQuery.toLowerCase())
      ).slice(0, 8) // Show max 8 suggestions
    : [];

  const isValid = canProceed() && !ageError;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray800} />
          </TouchableOpacity>
          <View style={styles.progress}>
            <View style={[styles.progressBar, { width: '42%' }]} />
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This information helps us personalize your experience
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="What should we call you?"
              placeholderTextColor={Colors.gray400}
              value={data.name}
              onChangeText={handleNameChange}
              maxLength={30}
              autoCapitalize="words"
            />
            <Text style={styles.hint}>This is how you'll appear to others</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={[styles.input, ageError ? styles.inputError : null]}
              placeholder="Your age"
              placeholderTextColor={Colors.gray400}
              value={data.age?.toString() || ''}
              onChangeText={handleAgeChange}
              keyboardType="number-pad"
              maxLength={3}
            />
            {ageError ? (
              <Text style={styles.errorText}>{ageError}</Text>
            ) : (
              <Text style={styles.hint}>You must be 18 or older</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationInputContainer}>
              <Ionicons name="location-outline" size={20} color={Colors.gray400} style={styles.locationIcon} />
              <TextInput
                style={styles.locationInput}
                placeholder="Start typing your city..."
                placeholderTextColor={Colors.gray400}
                value={locationQuery}
                onChangeText={handleLocationChange}
                onFocus={() => setShowSuggestions(locationQuery.length > 0)}
                autoCapitalize="words"
              />
              {locationQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setLocationQuery('');
                    updateData({ location: '' });
                    setShowSuggestions(false);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.gray400} />
                </TouchableOpacity>
              )}
            </View>

            {showSuggestions && filteredCities.length > 0 && (
              <View style={styles.locationList}>
                {filteredCities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.locationItem,
                      data.location === city && styles.locationItemSelected,
                    ]}
                    onPress={() => selectLocation(city)}
                  >
                    <Ionicons name="location" size={18} color={Colors.gray400} style={styles.suggestionIcon} />
                    <Text
                      style={[
                        styles.locationText,
                        data.location === city && styles.locationTextSelected,
                      ]}
                    >
                      {city}
                    </Text>
                    {data.location === city && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {data.location ? (
              <View style={styles.selectedLocation}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.selectedLocationText}>{data.location}</Text>
              </View>
            ) : (
              <Text style={styles.hint}>Start typing to find your city</Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    marginHorizontal: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray600,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray800,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  inputError: {
    borderColor: Colors.error,
  },
  hint: {
    ...Typography.caption,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: Spacing.md,
  },
  locationIcon: {
    marginRight: Spacing.sm,
  },
  locationInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  suggestionIcon: {
    marginRight: Spacing.sm,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  selectedLocationText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '500',
  },
  locationList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  locationItemSelected: {
    backgroundColor: Colors.gray50,
  },
  locationText: {
    ...Typography.body,
    color: Colors.gray700,
    flex: 1,
  },
  locationTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.gray200,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.surface,
  },
  buttonTextDisabled: {
    color: Colors.gray400,
  },
});

export default OnboardingBasicsScreen;
