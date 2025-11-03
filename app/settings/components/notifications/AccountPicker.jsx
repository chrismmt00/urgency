"use client";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export default function AccountPicker({
  accounts = [],
  value,
  onChange,
  size = "small",
}) {
  return (
    <FormControl fullWidth size={size}>
      <InputLabel id="acc-label">Account</InputLabel>
      <Select
        labelId="acc-label"
        label="Account"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {accounts.map((a) => (
          <MenuItem key={a.id} value={a.id}>
            {a.email}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
