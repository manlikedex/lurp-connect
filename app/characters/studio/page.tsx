"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  Palette,
  Rotate3D,
  Save,
  Shirt,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

const colours = [
  "#a855f7",
  "#d946ef",
  "#ffffff",
  "#22c55e",
  "#ef4444",
  "#3b82f6",
];

const poses = ["Neutral", "Confident", "Relaxed", "Arms Folded"];

export default function CharacterStudioPage() {
  const [bodyColour, setBodyColour] = useState("#a855f7");
  const [clothingColour, setClothingColour] = useState("#111118");
  const [pose, setPose] = useState("Neutral");

  return (
    <AppShell>
      <PageHeader
        badge="3D Character Studio"
        title="Create your 3D character preview."
        description="Build a visual version of your RP character. This first version uses a simple placeholder model, ready to upgrade into full GTA-style customisation."
        icon={Rotate3D}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-h-[620px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#111118]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-white/40">Live Preview</p>
              <h2 className="text-xl font-black">Studio Model</h2>
            </div>

            <div className="rounded-full border border-purple-300/15 bg-purple-300/10 px-3 py-1.5 text-xs font-black text-purple-200">
              {pose}
            </div>
          </div>

          <div className="h-[560px]">
            <Canvas camera={{ position: [0, 2.2, 6], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[4, 6, 4]} intensity={1.8} />
              <Environment preset="city" />
              <OrbitControls enablePan={false} />

              <group position={[0, -1, 0]}>
                <CharacterModel
                  bodyColour={bodyColour}
                  clothingColour={clothingColour}
                  pose={pose}
                />
              </group>
            </Canvas>
          </div>
        </div>

        <aside className="space-y-5">
          <StudioPanel
            icon={Palette}
            title="Body Colour"
            description="Choose a base colour for the preview model."
          >
            <ColourPicker
              selected={bodyColour}
              onChange={setBodyColour}
            />
          </StudioPanel>

          <StudioPanel
            icon={Shirt}
            title="Clothing Colour"
            description="Choose a clothing colour for the character outfit."
          >
            <ColourPicker
              selected={clothingColour}
              onChange={setClothingColour}
            />
          </StudioPanel>

          <StudioPanel
            icon={Sparkles}
            title="Pose"
            description="Pick a preview pose for your character."
          >
            <div className="grid gap-2">
              {poses.map((item) => (
                <button
                  key={item}
                  onClick={() => setPose(item)}
                  className={`rounded-full border px-4 py-3 text-left text-sm font-black transition ${
                    pose === item
                      ? "border-purple-300/25 bg-purple-300/10 text-purple-100"
                      : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.055]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </StudioPanel>

          <button
            type="button"
            onClick={() =>
              alert(
                "Studio draft ready. Next step is saving this to Supabase character_3d_studio."
              )
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]"
          >
            <Save size={17} />
            Save Studio Draft
          </button>

          <Link
            href="/characters/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft size={17} />
            Back to Character Creation
          </Link>
        </aside>
      </section>
    </AppShell>
  );
}

function CharacterModel({
  bodyColour,
  clothingColour,
  pose,
}: {
  bodyColour: string;
  clothingColour: string;
  pose: string;
}) {
  const confident = pose === "Confident";
  const relaxed = pose === "Relaxed";
  const folded = pose === "Arms Folded";

  return (
    <group rotation={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color={bodyColour} roughness={0.45} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 2.25, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 32]} />
        <meshStandardMaterial color={bodyColour} roughness={0.45} />
      </mesh>

      {/* Torso / Clothing */}
      <mesh position={[0, 1.45, 0]}>
        <capsuleGeometry args={[0.65, 1.2, 8, 24]} />
        <meshStandardMaterial color={clothingColour} roughness={0.55} />
      </mesh>

      {/* Left Arm */}
      <mesh
        position={[
          folded ? -0.45 : -0.9,
          confident ? 1.5 : relaxed ? 1.25 : 1.55,
          folded ? 0.35 : 0,
        ]}
        rotation={[
          folded ? 1.25 : relaxed ? 0.45 : 0.15,
          0,
          folded ? 1.25 : confident ? -0.35 : 0.35,
        ]}
      >
        <capsuleGeometry args={[0.16, 1.25, 8, 18]} />
        <meshStandardMaterial color={bodyColour} roughness={0.45} />
      </mesh>

      {/* Right Arm */}
      <mesh
        position={[
          folded ? 0.45 : 0.9,
          confident ? 1.5 : relaxed ? 1.25 : 1.55,
          folded ? 0.35 : 0,
        ]}
        rotation={[
          folded ? 1.25 : relaxed ? 0.45 : 0.15,
          0,
          folded ? -1.25 : confident ? 0.35 : -0.35,
        ]}
      >
        <capsuleGeometry args={[0.16, 1.25, 8, 18]} />
        <meshStandardMaterial color={bodyColour} roughness={0.45} />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.28, 0.2, 0]} rotation={[0.05, 0, 0.05]}>
        <capsuleGeometry args={[0.2, 1.25, 8, 18]} />
        <meshStandardMaterial color="#1f1f2a" roughness={0.6} />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.28, 0.2, 0]} rotation={[0.05, 0, -0.05]}>
        <capsuleGeometry args={[0.2, 1.25, 8, 18]} />
        <meshStandardMaterial color="#1f1f2a" roughness={0.6} />
      </mesh>

      {/* Base platform */}
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.08, 64]} />
        <meshStandardMaterial color="#171722" roughness={0.75} />
      </mesh>
    </group>
  );
}

function StudioPanel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Box;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
        <Icon size={22} />
      </div>

      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function ColourPicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {colours.map((colour) => (
        <button
          key={colour}
          type="button"
          onClick={() => onChange(colour)}
          className={`h-10 rounded-full border transition hover:scale-105 ${
            selected === colour
              ? "border-white"
              : "border-white/10"
          }`}
          style={{ backgroundColor: colour }}
        />
      ))}
    </div>
  );
}