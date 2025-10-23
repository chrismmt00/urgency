"use client";
import { AppBar, Toolbar, Box, Button, Typography } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

export default function NavBar() {
  return (
    <AppBar color="transparent" elevation={0} position="sticky">
      <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}
        >
          <MailOutlineIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            MailTickr
          </Typography>
        </Box>
        <Button href="/inbox" variant="outlined">
          Try Inbox Demo
        </Button>
        <Button href="#get-started" sx={{ ml: 1 }} variant="contained">
          Get Started
        </Button>
      </Toolbar>
    </AppBar>
  );
}
