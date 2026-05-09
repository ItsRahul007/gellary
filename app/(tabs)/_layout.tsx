import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Dimensions, View } from "react-native";

const SCREEN_W = Dimensions.get("window").width;
const BAR_WIDTH = 200;
const BAR_HEIGHT = 60;

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 48,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "rgba(0,122,255,0.18)" : "transparent",
      }}
    >
      <Ionicons
        name={name as any}
        size={22}
        color={focused ? "#007AFF" : "#8E8E93"}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          borderRadius: 50,
          marginHorizontal: 80,
          marginBottom: 16,
          height: 40,
          overflow: "hidden",
          borderWidth: 0,
          backgroundColor: "#1C1C1E",
          borderColor: "#1C1C1E",
          // shadow
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          height: 45,
          backgroundColor: "#1C1C1E",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "images" : "images-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="albums"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "folder" : "folder-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "heart" : "heart-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
