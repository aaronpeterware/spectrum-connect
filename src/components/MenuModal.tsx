import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/theme';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
}

const MenuModal: React.FC<MenuModalProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<any>();

  const goToScreen = (screen: string) => {
    onClose();
    navigation.navigate(screen);
  };

  const goToTab = (tabName: string) => {
    onClose();
    navigation.navigate('MainTabs', { screen: tabName });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.menuPanel}>
          <View style={styles.menuHeader}>
            <View style={styles.menuLogoContainer}>
              <Text style={styles.menuLogoSpectrum}>Haven</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
            <TouchableOpacity style={styles.menuItem} onPress={() => goToTab('Home')}>
              <Ionicons name="home-outline" size={22} color="white" />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => goToScreen('Companions')}>
              <Ionicons name="heart-circle-outline" size={22} color="white" />
              <Text style={styles.menuItemText}>Companions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => goToScreen('Matches')}>
              <Ionicons name="sparkles-outline" size={22} color="white" />
              <Text style={styles.menuItemText}>Find Matches</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => goToTab('Classroom')}>
              <Ionicons name="book-outline" size={22} color="white" />
              <Text style={styles.menuItemText}>Learning</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => goToScreen('Store')}>
              <Ionicons name="bag-outline" size={22} color="white" />
              <Text style={styles.menuItemText}>Store</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => goToTab('Messages')}>
              <Ionicons name="chatbubbles-outline" size={22} color="white" />
              <Text style={styles.menuItemText}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => goToTab('Profile')}>
              <Ionicons name="settings-outline" size={22} color="white" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
              <Ionicons name="help-circle-outline" size={22} color="white" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
              <Text style={[styles.menuItemText, { color: Colors.error }]}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuPanel: {
    width: '80%',
    height: '100%',
    backgroundColor: '#1A1A2E',
    paddingTop: 60,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLogoSpectrum: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginRight: 5,
  },
  menuLogoConnect: {
    fontSize: 18,
    fontWeight: '300',
    color: Colors.primary,
    fontStyle: 'italic',
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginLeft: 15,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 15,
  },
});

export default MenuModal;
