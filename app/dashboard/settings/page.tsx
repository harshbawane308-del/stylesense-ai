"use client";

import { Bell, LockKeyhole, UserRound } from "lucide-react";
import { PageIntro } from "../_components/dashboard-shell";

const settings = [
  [UserRound, "Profile", "Name, role and workspace identity", "Alex Rivera / Product designer"],
  [Bell, "Notifications", "Choose what reaches your workspace", "Email notifications enabled"],
  [LockKeyhole, "Security", "Authentication and access controls", "Authentication will be connected later"],
] as const;

export default function SettingsPage() {
  return <div className="settings-page"><PageIntro eyebrow="Workspace / Account" title="Settings." description="Manage your workspace preferences. Account connections are not enabled in this preview." /><div className="settings-list">{settings.map(([Icon, title, description, value]) => <div className="settings-row" key={title}><span className="settings-icon"><Icon size={18} /></span><div><strong>{title}</strong><p>{description}</p></div><span className="settings-value">{value}</span><button className="outline-button" disabled>Manage</button></div>)}</div></div>;
}