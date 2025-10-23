"use client";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import NavBar from "./components/NavBar";

export default function Home() {
  return (
    <>
      <NavBar />
      {/* Hero */}
      <Box
        sx={{
          py: 12,
          background: "linear-gradient(180deg, #ffffff 0, #F5F6F7 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{ fontWeight: 800, lineHeight: 1.1 }}
              >
                Beat your inbox with{" "}
                <span style={{ color: "#D84C4C" }}>color-coded</span> timers.
              </Typography>
              <Typography sx={{ mt: 2, color: "text.secondary" }}>
                MailTickr starts a countdown on each new email and gently nudges
                you: green → yellow → red. For brains that love visual cues.
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                <Button href="/inbox" size="large" variant="contained">
                  Try Inbox Demo
                </Button>
                <Button href="#features" size="large" variant="outlined">
                  See Features
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
                <img
                  src="/hero-mock.png"
                  alt="Timer preview"
                  style={{ width: "100%", borderRadius: 16 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container id="features" maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={3}>
          {[
            {
              icon: <AccessTimeIcon />,
              title: "Live countdowns",
              text: "Each email gets its own ticking timer based on your preset (24/48/72/custom).",
            },
            {
              icon: <ColorLensIcon />,
              title: "Color clarity",
              text: "Green to yellow to red—your brain always knows what to tackle first.",
            },
            {
              icon: <CheckCircleIcon />,
              title: "Gentle nudges",
              text: "Optional sounds/haptics and push reminders before time runs out.",
            },
          ].map((f, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper
                elevation={1}
                sx={{ p: 3, height: "100%", borderRadius: 4 }}
              >
                <Stack spacing={2}>
                  <Box sx={{ fontSize: 28 }}>{f.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {f.title}
                  </Typography>
                  <Typography color="text.secondary">{f.text}</Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Box id="get-started" sx={{ py: 10, backgroundColor: "#fff" }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Ready to see your emails differently?
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Connect Outlook (Gmail soon) and let the timers guide your day.
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button variant="contained" href="/inbox">
              Open Inbox Demo
            </Button>
            <Button variant="outlined">Join Beta</Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
