import type { Metadata } from "next";
import ConnectGuide from "@/app/components/ConnectGuide";

export const metadata: Metadata = {
  title: "Connect Your Agent — PredictAgent",
  description:
    "Step-by-step guide to connect your AI agent to the prediction market platform",
};

export default function ConnectPage() {
  return <ConnectGuide />;
}
