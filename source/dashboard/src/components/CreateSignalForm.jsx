import React, { useState } from "react";
import { createIntersection } from "../utils/apiClient.js";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MapIcon from "@mui/icons-material/Map";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapPicker = ({ open, onClose, onLocationSelect, initialPosition }) => {
  const [position, setPosition] = useState(initialPosition);

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    return position === null ? null : <Marker position={position}></Marker>;
  };

  const handleSelect = () => {
    onLocationSelect(position);
    onClose();
  };

  // Set position when open changes
  React.useEffect(() => {
    if (open) {
      setPosition(initialPosition);
    }
  }, [open, initialPosition]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Chọn vị trí trên bản đồ</DialogTitle>
      <DialogContent sx={{ height: "60vh" }}>
        <MapContainer
          center={initialPosition}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSelect} variant="contained" disabled={!position}>
          Chọn
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function CreateSignalForm({ onBack, onSuccess }) {
  const [name, setName] = useState("");
  const [mac, setMac] = useState("");
  const [pillars, setPillars] = useState([
    { lat: "", lng: "", description: "", groupId: "A" },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedPillarIndex, setSelectedPillarIndex] = useState(null);

  const handleAddPillar = () => {
    setPillars([
      ...pillars,
      { lat: "", lng: "", description: "", groupId: "A" },
    ]);
  };

  const handleRemovePillar = (index) => {
    setPillars(pillars.filter((_, i) => i !== index));
  };

  const handlePillarChange = (index, field, value) => {
    const updated = [...pillars];
    updated[index][field] = value;
    setPillars(updated);
  };

  const handleOpenMap = (index) => {
    setSelectedPillarIndex(index);
    setMapOpen(true);
  };

  const handleCloseMap = () => {
    setMapOpen(false);
    setSelectedPillarIndex(null);
  };

  const handleLocationSelect = (location) => {
    if (selectedPillarIndex !== null) {
      const { lat, lng } = location;
      handlePillarChange(selectedPillarIndex, "lat", lat.toFixed(6));
      handlePillarChange(selectedPillarIndex, "lng", lng.toFixed(6));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate
    if (!name || !mac) {
      setMessage("Vui lòng điền đầy đủ tên và địa chỉ MAC");
      setLoading(false);
      return;
    }

    // Convert pillars lat/lng to numbers
    const formattedPillars = pillars.map((p) => ({
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      description: p.description,
      groupId: p.groupId,
    }));

    // Check for invalid numbers
    if (formattedPillars.some((p) => isNaN(p.lat) || isNaN(p.lng))) {
      setMessage("Vui lòng nhập tọa độ hợp lệ cho tất cả các trụ đèn");
      setLoading(false);
      return;
    }

    try {
      await createIntersection({
        name,
        mac,
        pillars: formattedPillars,
      });
      setMessage("Tạo đèn tín hiệu thành công!");
      // Clear form
      setName("");
      setMac("");
      setPillars([{ lat: "", lng: "", description: "", groupId: "A" }]);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setMessage(err.message || "Tạo đèn tín hiệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: 800,
        m: "auto",
        p: 3,
        border: "1px solid #ccc",
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" component="h2">
        Tạo đèn tín hiệu mới
      </Typography>

      <TextField
        label="Tên nút giao thông"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="VD: Ngã tư Nguyễn Văn Linh - Nguyễn Hữu Thọ"
        required
        fullWidth
      />

      <TextField
        label="Địa chỉ MAC"
        type="text"
        value={mac}
        onChange={(e) => setMac(e.target.value)}
        placeholder="VD: ba:ab:ab:11:22:33"
        required
        fullWidth
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Các trụ đèn tín hiệu
      </Typography>

      {pillars.map((pillar, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            border: "1px solid #ddd",
            borderRadius: 1,
            position: "relative",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            Trụ đèn #{index + 1}
            <IconButton
              color="primary"
              onClick={() => handleOpenMap(index)}
              size="small"
              sx={{ p: 0 }}
            >
              <MapIcon />
            </IconButton>
          </Typography>
          {pillars.length > 1 && (
            <IconButton
              onClick={() => handleRemovePillar(index)}
              sx={{ position: "absolute", top: 8, right: 8 }}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              mb: 1,
            }}
          >
            <TextField
              label="Vĩ độ (Latitude)"
              type="number"
              value={pillar.lat}
              onChange={(e) => handlePillarChange(index, "lat", e.target.value)}
              placeholder="VD: 10.740241"
              required
              fullWidth
              inputProps={{ step: "any" }}
            />
            <TextField
              label="Kinh độ (Longitude)"
              type="number"
              value={pillar.lng}
              onChange={(e) => handlePillarChange(index, "lng", e.target.value)}
              placeholder="VD: 106.697037"
              required
              fullWidth
              inputProps={{ step: "any" }}
            />
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
            }}
          >
            <TextField
              label="Mô tả"
              type="text"
              value={pillar.description}
              onChange={(e) =>
                handlePillarChange(index, "description", e.target.value)
              }
              placeholder="VD: Trụ Đông Nam"
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel id={`group-id-label-${index}`}>Nhóm</InputLabel>
              <Select
                labelId={`group-id-label-${index}`}
                value={pillar.groupId}
                label="Nhóm"
                onChange={(e) =>
                  handlePillarChange(index, "groupId", e.target.value)
                }
              >
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      ))}

      <Button
        onClick={handleAddPillar}
        variant="outlined"
        startIcon={<AddIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Thêm trụ đèn
      </Button>

      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Tạo đèn tín hiệu"}
        </Button>
        <Button onClick={onBack} variant="outlined">
          Quay lại
        </Button>
      </Box>

      {message && (
        <Alert
          sx={{ mt: 2 }}
          severity={message.includes("thành công") ? "success" : "error"}
        >
          {message}
        </Alert>
      )}

      {selectedPillarIndex !== null && (
        <MapPicker
          open={mapOpen}
          onClose={handleCloseMap}
          onLocationSelect={handleLocationSelect}
          initialPosition={{
            lat: parseFloat(pillars[selectedPillarIndex]?.lat) || 10.73333,
            lng: parseFloat(pillars[selectedPillarIndex]?.lng) || 106.7209,
          }}
        />
      )}
    </Box>
  );
}
