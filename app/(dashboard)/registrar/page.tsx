"use client";

import BiometricRegistrationView from "@/components/attendance/BiometricRegistrationView";

export default function RegisterAttendancePage() {
  return (
    <BiometricRegistrationView
      allowedRoles={["ADMIN"]}
      previewRoute="/registrar/prev"
      vacationsRoute="/mis-asistencias"
      homeRoute="/"
    />
  );
}
