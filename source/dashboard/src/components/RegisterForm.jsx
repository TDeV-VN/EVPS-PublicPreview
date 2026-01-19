import React, { useState } from "react";
import { registerUser } from "../utils/apiClient.js";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

export default function RegisterForm({ onBack, isAdmin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await registerUser({ fullName, email, role });
      setMessage(
        `Tạo tài khoản thành công cho ${email}. Mật khẩu tạm thời đã được gửi đến email.`
      );
      // Clear form
      setFullName("");
      setEmail("");
      setRole("user");
    } catch (err) {
      setMessage(err.message || "Tạo tài khoản thất bại");
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
        maxWidth: 500,
        m: "auto",
        p: 3,
        border: "1px solid #ccc",
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" component="h2">
        {isAdmin ? "Tạo tài khoản mới" : "Đăng ký tài khoản"}
      </Typography>
      <Alert severity="info">
        Mật khẩu tạm thời sẽ được tạo và gửi đến email của người dùng.
      </Alert>
      <TextField
        label="Họ tên"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@domain.com"
        required
        fullWidth
      />
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Tạo tài khoản"}
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
    </Box>
  );
}
