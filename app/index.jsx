import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, StatusBar, Image } from "react-native";
import RoleSelection from "../src/screens/RoleSelection";

export default function Index() {
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      setShowRoleSelection(true);
    }, 2800);

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, logoTranslateY]);

  if (showRoleSelection) {
    return <RoleSelection />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05053D" />

      <Animated.Image
        source={require("../assets/images/logo.png")}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05053D",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginTop: -4,
  },
});