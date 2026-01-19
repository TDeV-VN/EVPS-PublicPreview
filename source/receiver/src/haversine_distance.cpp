#include <Arduino.h>
#include <cmath>
#include <vector>
#include "haversine_distance.h"
#include <Preferences.h>

constexpr double EARTH_RADIUS_KM = 6371.0;

// Global storage for traffic lights
std::vector<TrafficLight> trafficLights = {};

// HÀM TÍNH KHOẢNG CÁCH
double haversineDistance(double lat1, double lon1,
                         double lat2, double lon2) {
    lat1 = lat1 * PI / 180.0;
    lon1 = lon1 * PI / 180.0;
    lat2 = lat2 * PI / 180.0;
    lon2 = lon2 * PI / 180.0;

    double dlat = lat2 - lat1;
    double dlon = lon2 - lon1;

    double a = std::pow(std::sin(dlat / 2), 2) +
               std::cos(lat1) * std::cos(lat2) *
               std::pow(std::sin(dlon / 2), 2);

    double c = 2 * std::asin(std::sqrt(a));

    return EARTH_RADIUS_KM * c;
}

void saveTrafficLightsConfigToNVS() {
    Preferences prefs;
    prefs.begin("traffic_cfg", false); // false = RW mode
    
    size_t size = trafficLights.size() * sizeof(TrafficLight);
    if (size > 0) {
        prefs.putBytes("lights", trafficLights.data(), size);
        prefs.putInt("count", trafficLights.size());
        Serial.printf("Saved %d lights to NVS\n", trafficLights.size());
    }
    
    prefs.end();
}

void updateTrafficLightsConfig(const std::vector<TrafficLight>& newLights) {
    if (!newLights.empty()) {
        trafficLights = newLights;
        Serial.printf("Updated Traffic Lights Config: %d pillars\n", trafficLights.size());
        for(const auto& t : trafficLights) {
             Serial.printf(" - Pair: %d, Lat: %.6f, Lng: %.6f\n", t.pairId, t.lat, t.lon);
        }
        saveTrafficLightsConfigToNVS();
    }
}

void loadTrafficLightsConfigFromNVS() {
    Preferences prefs;
    prefs.begin("traffic_cfg", true); // true = ReadOnly
    
    int count = prefs.getInt("count", 0);
    if (count > 0) {
        size_t size = count * sizeof(TrafficLight);
        TrafficLight* buffer = new TrafficLight[count];
        
        size_t readBytes = prefs.getBytes("lights", buffer, size);
        
        if (readBytes == size) {
            trafficLights.clear();
            for(int i=0; i<count; i++) {
                trafficLights.push_back(buffer[i]);
            }
            Serial.printf("Loaded %d lights from NVS\n", count);
             for(const auto& t : trafficLights) {
                 Serial.printf(" - Pair: %d, Lat: %.6f, Lng: %.6f\n", t.pairId, t.lat, t.lon);
            }
        } else {
            Serial.println("Error reading lights from NVS");
        }
        delete[] buffer;
    } else {
        Serial.println("No config found in NVS");
    }
    prefs.end();
}

// HÀM TRẢ VỀ ID CẶP ĐÈN GẦN NHẤT
int findNearestTrafficLightPairId(double vehicleLat, double vehicleLon, double &minDistOut) {

    if (trafficLights.empty()) {
        minDistOut = 99999.0;
        return -1;
    }

    int nearestPairId = trafficLights[0].pairId;
    double minDist = haversineDistance(
        vehicleLat, vehicleLon,
        trafficLights[0].lat, trafficLights[0].lon
    );

    for (size_t i = 1; i < trafficLights.size(); i++) {
        double d = haversineDistance(
            vehicleLat, vehicleLon,
            trafficLights[i].lat, trafficLights[i].lon
        );

        if (d < minDist) {
            minDist = d;
            nearestPairId = trafficLights[i].pairId;
        }
    }
    
    minDistOut = minDist;
    return nearestPairId;
}
