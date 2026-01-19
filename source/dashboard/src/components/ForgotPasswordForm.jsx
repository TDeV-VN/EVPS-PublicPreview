import React, { useState } from "react";
import { forgotPassword } from "../utils/apiClient";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import LockResetIcon from "@mui/icons-material/LockReset";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

export default function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await forgotPassword(email);
      setMessage("Một mật khẩu mới đã được gửi đến email của bạn.");
    } catch (err) {
      setMessage(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockResetIcon />
        </Avatar>

        <Typography component="h1" variant="h5">
          Quên Mật khẩu
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 1 }}
        >
          Nhập email của bạn để nhận mật khẩu mới.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>

          <Link
            href="#"
            variant="body2"
            onClick={onBack}
            sx={{ cursor: "pointer" }}
          >
            {"< Quay lại đăng nhập"}
          </Link>

          {message && (
            <Alert
              sx={{ mt: 2 }}
              severity={
                message.includes("mật khẩu mới đã được gửi")
                  ? "success"
                  : "error"
              }
            >
              {message}
            </Alert>
          )}
        </Box>
      </Box>
    </Container>
  );
}
