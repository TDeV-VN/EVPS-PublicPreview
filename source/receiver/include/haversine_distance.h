#ifndef HAVERSINE_DISTANCE_H
#define HAVERSINE_DISTANCE_H

#include <vector>
#include <Arduino.h>

struct TrafficLight {
    int pairId;   // ID cặp đèn
    double lat;
    double lon;
};

double haversineDistance(double lat1, double lon1, double lat2, double lon2);
int findNearestTrafficLightPairId(double vehicleLat, double vehicleLon, double &minDistOut);
void updateTrafficLightsConfig(const std::vector<TrafficLight>& newLights);
void loadTrafficLightsConfigFromNVS();

#endif
